/**
 * Tour Controller
 * --> create Tour
 * --> update Tour
 * --> delete Tour
 * --> get Tours
 * --> get specific tour by id
 */

import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../../../database/connection";
import { IExtendedRequest } from "../../../middleware/type";
import { QueryTypes } from "sequelize";
import DynamicPricingService from "../../../services/dynamic-pricing-service";

interface IInterfaceTourData {
  tourId: string;
  tourTitle: string;
  tourDescription: string;
  totalCapacity: number;
  bookedSeats: number;
  basePrice: number;
  currentPrice: number;
  minimumPrice: number;
  discountPercentage: number;
  discountReason: string;
  tourPhoto: string;
  tourDuration: string;
  tourStartDate: string;
  tourEndDate: string;
  tourStatus: string;
  categoryId: string;
  categoryName: string;
}

class TourController {
  // private static pricingService = new DynamicPricingService();

  static async createTour(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const {
      tourTitle,
      tourDescription,
      totalCapacity,
      basePrice,
      tourDuration,
      tourStartDate,
      tourEndDate,
      categoryIds,
    } = req.body;

    if (
      !tourTitle ||
      !tourDescription ||
      !totalCapacity ||
      !basePrice ||
      !tourDuration ||
      !tourStartDate ||
      !tourEndDate ||
      !categoryIds
    ) {
      res.status(400).json({
        message:
          "Please Provide tourTitle, tourDescription, totalCapacity, basePrice, tourDuration, tourStartDate, tourEndDate",
      });
      return;
    }

    const tourPhoto = req.file
      ? req.file.path
      : "https://imgs.search.brave.com/saWvZkYu0CkteK4E39jo_wLLzLm1bK-Ag6jFDXkiCEY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/dmVjdG9yc3RvY2su/Y29tL2kvNTAwcC84/OC8zMS9pbWFnZS1u/b3QtYW4tYXZhaWxh/YmxlLWljb24tdmVj/dG9yLTUyOTI4ODMx/LmpwZw";

    const tourId = uuidv4();

    const minimumPrice = parseFloat(basePrice) * 0.7;

    const pricingService = new DynamicPricingService();

    const initialPricing = pricingService.calculateDynamicPricing({
      id: tourId,
      basePrice: parseFloat(basePrice),
      minimumPrice: minimumPrice,
      totalCapacity: parseInt(totalCapacity),
      bookedSeats: 0,
      tourStartDate: new Date(tourStartDate),
    });

    await sequelize.query(
      `INSERT INTO tour_${organizationNumber} (id, tourTitle, tourDescription, totalCapacity, bookedSeats, basePrice, currentPrice, minimumPrice, discountPercentage, discountReason, tourPhoto, tourDuration, tourStartDate, tourEndDate, tourStatus) VALUES (?,?,?,?,0,?,?,?,?,?,?,?,?,?,'active')`,
      {
        replacements: [
          tourId,
          tourTitle,
          tourDescription,
          totalCapacity,
          basePrice,
          initialPricing.newPrice,
          minimumPrice,
          initialPricing.discountPercentage,
          initialPricing.discountReason,
          tourPhoto,
          tourDuration,
          tourStartDate,
          tourEndDate,
        ],
        type: QueryTypes.INSERT,
      }
    );

    //Handle Categories
    let categoryIdsParsed: string[] = [];
    if (req.body.categoryIds) {
      try {
        categoryIdsParsed = JSON.parse(req.body.categoryIds);
      } catch (err) {
        return res.status(400).json({ message: "Invalid categoryIds format" });
      }
    }

    if (Array.isArray(categoryIdsParsed) && categoryIdsParsed.length > 0) {
      for (const categoryId of categoryIdsParsed) {
        await sequelize.query(
          `INSERT INTO tour_category_${organizationNumber} (tourId, categoryId) VALUES (?,?)`,
          {
            replacements: [tourId, categoryId],
            type: QueryTypes.INSERT,
          }
        );
      }
    }

    res.status(200).json({
      message: "Tour inserted sucessfully",
      tourId,
      pricing: {
        basePrice: parseFloat(basePrice),
        currentPrice: initialPricing.newPrice,
        discount: initialPricing.discountPercentage,
        discountReason: initialPricing.discountReason,
      },
    });
  }

  static async getTours(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;

    const tours = await sequelize.query(
      `SELECT 
        t.id AS tourId, 
        t.tourTitle, 
        t.tourDescription, 
        t.totalCapacity, 
        t.bookedSeats,
        t.basePrice,
        t.currentPrice,
        t.minimumPrice,
        t.discountPercentage, 
        t.tourPhoto, 
        t.tourDuration, 
        t.tourStartDate, 
        t.tourEndDate, 
        t.tourStatus, 
        c.id AS categoryId, 
        c.categoryName, 
        c.categoryDescription 
        FROM tour_${organizationNumber} AS t 
        JOIN tour_category_${organizationNumber} AS tc ON t.id = tc.tourId 
        JOIN category_${organizationNumber} AS c ON tc.categoryId = c.id`,
      {
        type: QueryTypes.SELECT,
      }
    );

    const groupedTours = Object.values(
      tours.reduce((acc: any, row: any) => {
        if (!acc[row.tourId]) {
          const availableSeats = row.totalCapacity - row.bookedSeats;
          const occupancyRate = (
            (row.bookedSeats / row.totalCapacity) *
            100
          ).toFixed(2);
          const savings = (row.basePrice - row.currentPrice).toFixed(2);

          acc[row.tourId] = {
            tourId: row.tourId,
            tourTitle: row.tourTitle,
            tourDescription: row.tourDescription,
            capacity: {
              total: row.totalCapacity,
              booked: row.bookedSeats,
              available: availableSeats,
              occupancyRate: `${occupancyRate}%`,
            },
            pricing: {
              basePrice: parseFloat(row.basePrice),
              currentPrice: parseFloat(row.currentPrice),
              savings: parseFloat(savings),
              discountPercentage: parseFloat(row.discountPercentage),
              discountReason: row.discountReason,
            },
            tourPhoto: row.tourPhoto,
            tourDuration: row.tourDuration,
            tourStartDate: row.tourStartDate,
            tourEndDate: row.tourEndDate,
            tourStatus: row.tourStatus,
            categories: [],
          };
        }

        acc[row.tourId].categories.push({
          categoryId: row.categoryId,
          categoryName: row.categoryName,
        });

        return acc;
      }, {})
    );

    res.status(200).json({
      data: groupedTours,
      message: "Tours fetched sucessfully",
    });
  }

  static async deleteTour(req: IExtendedRequest, res: Response) {
    const orgainzationNumber = req.currentUser?.currentOrganizationNumber;
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        message: "No tour of the given id is found",
      });
      return;
    }

    await sequelize.query(
      `DELETE FROM tour_category_${orgainzationNumber} WHERE tourId = ?`,
      {
        replacements: [id],
        type: QueryTypes.DELETE,
      }
    );

    await sequelize.query(
      `DELETE FROM tour_${orgainzationNumber} WHERE id = ?`,
      {
        replacements: [id],
        type: QueryTypes.DELETE,
      }
    );

    res.status(200).json({
      message: "Tour Deleted Sucessfully",
    });
  }

  static async getSingleTour(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const { id } = req.params;

    const rows = (await sequelize.query(
      `SELECT t.id as tourId, 
            t.tourTitle, 
            t.tourDescription, 
            t.totalCapacity,
            t.bookedSeats, 
            t.basePrice, 
            t.currentPrice,
            t.minimumPrice,
            t.discountPercentage,
            t.discountReason,
            t.tourPhoto, 
            t.tourDuration, 
            t.tourStartDate, 
            t.tourEndDate, 
            t.tourStatus, 
            c.id AS categoryId, 
            c.categoryName,
            c.categoryDescription
     FROM tour_${organizationNumber} AS t
     JOIN tour_category_${organizationNumber} AS tc ON t.id = tc.tourId
     JOIN category_${organizationNumber} AS c ON tc.categoryId = c.id
     WHERE t.id = ?`,
      {
        replacements: [id],
        type: QueryTypes.SELECT,
      }
    )) as IInterfaceTourData[];

    if (!rows.length) {
      return res.status(404).json({ message: "No Tour is found" });
    }

    const firstRow = rows[0];
    const availableSeats = firstRow.totalCapacity - firstRow.bookedSeats;
    const occupancyRate = (
      (firstRow.bookedSeats / firstRow.totalCapacity) *
      100
    ).toFixed(2);
    const savings = (firstRow.basePrice - firstRow.currentPrice).toFixed(2);

    const tour = {
      tourId: firstRow.tourId,
      tourTitle: firstRow.tourTitle,
      tourDescription: firstRow.tourDescription,
      capacity: {
        total: firstRow.totalCapacity,
        booked: firstRow.bookedSeats,
        available: availableSeats,
        occupancyRate: `${occupancyRate}%`,
      },
      pricing: {
        basePrice: parseFloat(firstRow.basePrice.toString()),
        currentPrice: parseFloat(firstRow.currentPrice.toString()),
        minimumPrice: parseFloat(firstRow.minimumPrice.toString()),
        savings: parseFloat(savings),
        discountPercentage: parseFloat(firstRow.discountPercentage.toString()),
        discountReason: firstRow.discountReason,
      },
      tourPhoto: firstRow.tourPhoto,
      tourDuration: firstRow.tourDuration,
      tourStartDate: firstRow.tourStartDate,
      tourEndDate: firstRow.tourEndDate,
      tourStatus: firstRow.tourStatus,
      categories: rows.map((row: any) => ({
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        categoryDescription: row.categoryDescription,
      })),
    };

    res.status(200).json({
      data: tour,
      message: "Tour fetched successfully",
    });
  }

  static async updateTour(req: IExtendedRequest, res: Response) {
    const orgainzationNumber = req.currentUser?.currentOrganizationNumber;
    const { id } = req.params;

    if (!id) {
      res.status(403).json({
        message: "Cannot match the id",
      });
      return;
    }

    const {
      tourTitle,
      tourDescription,
      totalCapacity,
      basePrice,
      tourStatus,
      tourDuration,
      tourStartDate,
      tourEndDate,
      categoryIds,
    } = req.body;
    if (
      !tourTitle ||
      !tourDescription ||
      !totalCapacity ||
      !basePrice ||
      !tourStatus ||
      !tourDuration ||
      !tourStartDate ||
      !tourEndDate ||
      !categoryIds
    ) {
      res.status(400).json({
        message:
          "please provide tourTitle, tourDescription, totalCapacity, basePrice, tourStatus, tourDuration, tourStartDate, tourEndDate, categoryIds",
      });
      return;
    }

    const [currentTour] = (await sequelize.query(
      `SELECT bookedSeats FROM tour_${orgainzationNumber} WHERE id = ?`,
      {
        replacements: [id],
        type: QueryTypes.SELECT,
      }
    )) as any[];

    if (!currentTour) {
      return res.status(404).json({ message: "Tour Not Found" });
    }

    const minimumPrice = parseFloat(basePrice) * 0.7;
    const pricingService = new DynamicPricingService();

    const updatedPricing = pricingService.calculateDynamicPricing({
      id,
      basePrice: parseFloat(basePrice),
      minimumPrice: minimumPrice,
      totalCapacity: parseInt(totalCapacity),
      bookedSeats: currentTour.bookedSeats,
      tourStartDate: new Date(tourStartDate),
    });

    let updateQuery: string;
    let replacements: any[];

    if (req.file) {
      const tourPhoto = req.file.path;

      updateQuery = `UPDATE tour_${orgainzationNumber} 
        SET tourTitle = ?, tourDescription = ?, totalCapacity = ?, 
        basePrice = ?, currentPrice = ?, minimumPrice = ?,
        discountPercentage = ?, discountReason = ?, tourStatus=?, 
        tourPhoto = ?, tourDuration = ?, tourStartDate = ?, tourEndDate = ?,
        lastPriceUpdate = NOW(),
      WHERE id = ?`;
      replacements = [
        tourTitle,
        tourDescription,
        totalCapacity,
        basePrice,
        updatedPricing.newPrice,
        minimumPrice,
        updatedPricing.discountPercentage,
        updatedPricing.discountReason,
        tourStatus,
        tourPhoto,
        tourDuration,
        tourStartDate,
        tourEndDate,
        id,
      ];
    } else {
      updateQuery = `UPDATE tour_${orgainzationNumber} 
        SET tourTitle = ?, tourDescription = ?, totalCapacity = ?, 
        basePrice = ?, currentPrice = ?, minimumPrice = ?,
        discountPercentage = ?, discountReason = ?, tourStatus=?, 
        tourDuration = ?, tourStartDate = ?, tourEndDate = ?,
        lastPriceUpdate = NOW()
      WHERE id = ?`;
      replacements = [
        tourTitle,
        tourDescription,
        totalCapacity,
        basePrice,
        updatedPricing.newPrice,
        minimumPrice,
        updatedPricing.discountPercentage,
        updatedPricing.discountReason,
        tourStatus,
        tourDuration,
        tourStartDate,
        tourEndDate,
        id,
      ];
    }

    await sequelize.query(updateQuery, {
      replacements,
      type: QueryTypes.UPDATE,
    });

    await sequelize.query(
      `DELETE FROM tour_category_${orgainzationNumber} WHERE tourId = ?`,
      {
        replacements: [id],
        type: QueryTypes.DELETE,
      }
    );

    let categoryIdsParsed: string[] = [];
    if (req.body.categoryIds) {
      try {
        categoryIdsParsed = JSON.parse(req.body.categoryIds);
      } catch (err) {
        return res.status(400).json({ message: "Invalid categoryIds format" });
      }
    }

    if (Array.isArray(categoryIdsParsed) && categoryIdsParsed.length > 0) {
      for (const categoryId of categoryIdsParsed) {
        await sequelize.query(
          `INSERT INTO tour_category_${orgainzationNumber} (tourId, categoryId) VALUES (?,?)`,
          {
            replacements: [id, categoryId],
            type: QueryTypes.INSERT,
          }
        );
      }
    }

    res.status(200).json({
      message: "Tour Updated Sucessfully",
      currentPrice: updatedPricing.newPrice,
      discount: updatedPricing.discountPercentage,
    });
  }

  static async bookTour(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const { tourId, numberOfSeats } = req.body;

    if (!tourId || !numberOfSeats) {
      return res.status(400).json({
        message: "Please provide tourId and numberOfSeats",
      });
    }

    const transaction = await sequelize.transaction();

    try {
      const [tours] = (await sequelize.query(
        `SELECT * FROM tour_${organizationNumber} WHERE id = ? FOR UPDATE`,
        {
          replacements: [tourId],
          transaction,
        }
      )) as any[];

      if (!tours || tours.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Tour not found",
        });
      }

      const tour = tours[0];
      const availableSeats = tour.totalCapacity - tour.bookedSeats;

      if (numberOfSeats > availableSeats) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Only ${availableSeats} seats available`,
        });
      }

      //locking the current price for this booking
      const lockedPrice = parseFloat(tour.currentPrice);
      const newBookedSeats = tour.bookedSeats + numberOfSeats;

      await sequelize.query(
        `UPDATE tour_${organizationNumber} SET bookedSeats = ? WHERE id = ?`,
        {
          replacements: [newBookedSeats, tourId],
          transaction,
        }
      );

      const pricingService = new DynamicPricingService();
      const newPricing = pricingService.calculateDynamicPricing({
        id: tourId,
        basePrice: parseFloat(tour.basePrice),
        minimumPrice: parseFloat(tour.minimumPrice),
        totalCapacity: tour.totalCapacity,
        bookedSeats: newBookedSeats,
        tourStartDate: new Date(tour.tourStartDate),
      });

      await sequelize.query(
        `UPDATE tour_${organizationNumber} SET currentPrice = ?, discountPercentage = ?, discountReason = ?, lastPriceUpdate = NOW() WHERE id = ?`,
        {
          replacements: [
            newPricing.newPrice,
            newPricing.discountPercentage,
            newPricing.discountReason,
            tourId,
          ],
          transaction,
        }
      );

      const bookingId = uuidv4();
      await sequelize.query(
        `INSERT INTO bookings_${organizationNumber} (id, tourId, userId, numberOfSeats, pricePerSeat, totalAmount, bookingDate) VALUES (?,?,?,?,?,?,NOW())`,
        {
          replacements: [
            bookingId,
            tourId,
            req.currentUser?.id,
            numberOfSeats,
            lockedPrice,
            lockedPrice * numberOfSeats,
          ],
          transaction,
        }
      );

      await transaction.commit();

      res.status(200).json({
        message: "Booking Sucessfull",
        data: {
          bookingId,
          tourId,
          numberOfSeats,
          pricePaid: lockedPrice,
          totalAmount: lockedPrice * numberOfSeats,
          newTourPrice: newPricing.newPrice,
          newDiscount: newPricing.discountPercentage,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error booking tour: ", error);
      res.status(500).json({
        message: "Booking Failed",
      });
    }
  }
}

export default TourController;
