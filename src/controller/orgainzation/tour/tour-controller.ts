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

interface IInterfaceTourData {
  tourId: string;
  tourTitle: string;
  tourDescription: string;
  tourNumberOfPeople: string;
  tourPrice: string;
  tourPhoto: string;
  tourDuration: string;
  tourStartDate: string;
  tourEndDate: string;
  tourStatus: string;
  categoryId: string;
  categoryName: string;
}

class TourController {
  static async createTour(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const {
      tourTitle,
      tourDescription,
      tourNumberOfPeople,
      tourPrice,
      tourDuration,
      tourStartDate,
      tourEndDate,
      categoryIds,
    } = req.body;

    if (
      !tourTitle ||
      !tourDescription ||
      !tourNumberOfPeople ||
      !tourPrice ||
      !tourDuration ||
      !tourStartDate ||
      !tourEndDate ||
      !categoryIds
    ) {
      res.status(400).json({
        message:
          "Please Provide tourTitle, tourDescription, tourNumberOfPeople, tourPrice, tourDuration, tourStartDate, tourEndDate",
      });
      return;
    }

    const tourPhoto = req.file ? req.file.path : null;

    const tourId = uuidv4();

    const [result] = await sequelize.query(
      `INSERT INTO tour_${organizationNumber} (id, tourTitle, tourDescription, tourNumberOfPeople, tourPrice, tourPhoto, tourDuration, tourStartDate, tourEndDate) VALUES (?,?,?,?,?,?,?,?,?)`,
      {
        replacements: [
          tourId,
          tourTitle,
          tourDescription,
          tourNumberOfPeople,
          tourPrice,
          tourPhoto,
          tourDuration,
          tourStartDate,
          tourEndDate,
        ],
        type: QueryTypes.INSERT,
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
    });
  }

  static async getTour(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;

    const tours = await sequelize.query(
      `SELECT t.id AS tourId, t.tourTitle, t.tourDescription, t.tourNumberOfPeople, t.tourPrice, t.tourPhoto, t.tourDuration, t.tourStartDate, t.tourEndDate, t.tourStatus, t.tourStatus, c.id AS categoryId, c.categoryName, c.categoryDescription FROM tour_${organizationNumber} AS t JOIN tour_category_${organizationNumber} AS tc ON t.id = tc.tourId JOIN category_${organizationNumber} AS c ON tc.categoryId = c.id`,
      {
        type: QueryTypes.SELECT,
      }
    );

    const groupedTours = Object.values(
      tours.reduce((acc: any, row: any) => {
        if (!acc[row.tourId]) {
          acc[row.tourId] = {
            tourId: row.tourId,
            tourTitle: row.tourTitle,
            tourDescription: row.tourDescription,
            tourNumberOfPeople: row.tourNumberOfPeople,
            tourPrice: row.tourPrice,
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
            t.tourNumberOfPeople, 
            t.tourPrice, 
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

    const tour = {
      tourId: rows[0].tourId,
      tourTitle: rows[0].tourTitle,
      tourDescription: rows[0].tourDescription,
      tourNumberOfPeople: rows[0].tourNumberOfPeople,
      tourPrice: rows[0].tourPrice,
      tourPhoto: rows[0].tourPhoto,
      tourDuration: rows[0].tourDuration,
      tourStartDate: rows[0].tourStartDate,
      tourEndDate: rows[0].tourEndDate,
      tourStatus: rows[0].tourStatus,
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
      tourNumberOfPeople,
      tourPrice,
      tourDuration,
      tourStartDate,
      tourEndDate,
      categoryIds,
    } = req.body;
    if (
      !tourTitle ||
      !tourDescription ||
      !tourNumberOfPeople ||
      !tourPrice ||
      !tourDuration ||
      !tourStartDate ||
      !tourEndDate ||
      !categoryIds
    ) {
      res.status(400).json({
        message:
          "please provide tourTitle, tourDescription, tourNumberOfPeople, tourPrice, tourDuration, tourStartDate, tourEndDate, categoryIds",
      });
      return;
    }

    const tourPhoto = req.file ? req.file.path : null;

    await sequelize.query(
      `UPDATE tour_${orgainzationNumber} SET tourTitle = ?, tourDescription = ?, tourNumberOfPeople = ?, tourPrice = ?, tourPhoto = ?, tourDuration = ?, tourStartDate = ?, tourEndDate = ? WHERE id = ?`,
      {
        replacements: [
          tourTitle,
          tourDescription,
          tourNumberOfPeople,
          tourPrice,
          tourPhoto,
          tourDuration,
          tourStartDate,
          tourEndDate,
          id,
        ],
        type: QueryTypes.UPDATE,
      }
    );

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
    });
  }
}

export default TourController;
