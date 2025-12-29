import { NextFunction, Request, Response } from "express";
import sequelize from "../../database/connection";
import GenerateRandomOrganizationNumberServices from "../../services/generate-unique-organization-number";
import { QueryTypes } from "sequelize";
import User from "../../database/model/user-model";
import { IExtendedRequest } from "../../middleware/type";

class OrganizationController {
  static async createOrganization(
    req: IExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // take organization details
      const {
        organizationName,
        organizationEmail,
        organizationPhoneNumber,
        organizationAddress,
      } = req.body;

      const organizationPanNo = req.body.organizationPanNo || null;
      const organizationVatNo = req.body.organizationVatNo || null;

      if (
        !organizationName ||
        !organizationEmail ||
        !organizationPhoneNumber ||
        !organizationAddress
      ) {
        res.status(400).json({
          message:
            "Please provide organizationName,organizationEmail,organizationPhoneNumber,organizationAddress",
        });
        return;
      }

      const organizationLogo = req.file
        ? req.file.path
        : "https://i.pinimg.com/736x/0f/68/94/0f6894e539589a50809e45833c8bb6c4.jpg";

      //unique organization number generator
      const organizationNumber =
        GenerateRandomOrganizationNumberServices.generateRandomOrganizatoinNumber();

      //creating table for organization
      await sequelize.query(
        `CREATE TABLE IF NOT EXISTS organization_${organizationNumber} (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        organizationName VARCHAR(255) NOT NULL,
        organizationEmail VARCHAR(255) NOT NULL UNIQUE,
        organizationPhoneNumber VARCHAR(255) NOT NULL UNIQUE,
        organizationAddress VARCHAR(255) NOT NULL,
        organizationLogo VARCHAR(255),
        organizationPanNo VARCHAR(255),
        organizationVatNo VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
      );

      //inserting organization number into the organization table
      await sequelize.query(
        `INSERT INTO organization_${organizationNumber}(organizationName, organizationEmail, organizationPhoneNumber, organizationAddress, organizationLogo, organizationPanNo, organizationVatNo) VALUES (?,?,?,?,?,?,?)`,
        {
          replacements: [
            organizationName,
            organizationEmail,
            organizationPhoneNumber,
            organizationAddress,
            organizationLogo,
            organizationPanNo,
            organizationVatNo,
          ],
          type: QueryTypes.INSERT,
        }
      );

      //creating user-organization table to store the list of organizations that a particular user have created
      await sequelize.query(`CREATE TABLE IF NOT EXISTS user_organization(
        id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),
        userId VARCHAR(36) REFERENCES users(id),
        organizationNumber VARCHAR(255) UNIQUE
    ) `);

      if (req.currentUser) {
        //INSERTING THE VALUE INTO user_organization table
        await sequelize.query(
          `INSERT INTO user_organization(userId, organizationNumber) VALUES (?,?)`,
          {
            replacements: [req.currentUser.id, organizationNumber],
          }
        );

        //updating the currentInstituteNumber
        await User.update(
          {
            currentOrganizationNumber: organizationNumber,
            role: "organization",
          },
          {
            where: {
              id: req.currentUser.id,
            },
          }
        );
      }

      if (req.currentUser) {
        req.currentUser.currentOrganizationNumber = organizationNumber;
      }
      next();
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: error,
      });
    }
  }

  static async createGuideTable(
    req: IExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const organizationNumber = req.currentUser?.currentOrganizationNumber;
      await sequelize.query(`CREATE TABLE IF NOT EXISTS guide_${organizationNumber} (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      guideName VARCHAR(255) NOT NULL,
      guideEmail VARCHAR(255) NOT NULL UNIQUE,
      guidePhoneNumber VARCHAR(20) NOT NULL UNIQUE,
      guideAddress VARCHAR(255),
      guideImage VARCHAR(255),
      guideJoinedDate DATE DEFAULT CURRENT_DATE,
      guideSalary DECIMAL(10, 2),
      guidePassword VARCHAR(255),
      guideStatus ENUM("active", "inactive", "suspended") DEFAULT "active",
      tourId VARCHAR(36) REFERENCES tour_${organizationNumber}(id),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);
      next();
    } catch (error) {
      res.status(500).json({
        message: error,
      });
    }
  }

  static async createTouristTable(
    req: IExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const organizationNumber = req.currentUser?.currentOrganizationNumber;
      await sequelize.query(`CREATE TABLE IF NOT EXISTS tourist_${organizationNumber} (
      id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),
      touristName VARCHAR(255) NOT NULL,
      touristAddress VARCHAR(255) NOT NULL,
      touristEmail VARCHAR(255) UNIQUE NOT NULL,
      touristPhoneNumber VARCHAR(255) UNIQUE NOT NULL,
      touristImage VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
      next();
    } catch (error) {
      res.status(500).json({
        message: error,
      });
    }
  }

  static async createCategoryTable(
    req: IExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const organizationNumber = req.currentUser?.currentOrganizationNumber;
      await sequelize.query(`CREATE TABLE IF NOT EXISTS category_${organizationNumber} (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        categoryName VARCHAR(255) NOT NULL,
        categoryDescription TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);
      next();
    } catch (error) {
      res.status(500).json({
        message: error,
      });
    }
  }

  static async createTourTable(
    req: IExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const organizationNumber = req.currentUser?.currentOrganizationNumber;
      await sequelize.query(`CREATE TABLE IF NOT EXISTS tour_${organizationNumber} (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      tourTitle VARCHAR(255) NOT NULL,
      tourDescription TEXT NOT NULL,
      tourDuration VARCHAR(255) NOT NULL,
      tourPhoto VARCHAR(255),

      -- Capacity Management
      totalCapacity INT NOT NULL,
      bookedSeats INT DEFAULT 0,

      -- Dynamic Pricing Fields
      basePrice DECIMAL(10, 2) NOT NULL COMMENT 'Original price before any discount',
      currentPrice DECIMAL(10, 2) NOT NULL COMMENT 'Current dynamically calculated price',
      minimumPrice DECIMAL(10, 2) NOT NULL COMMENT 'Floor price - will not go below this',

      -- Discount Tracking
      discountPercentage DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Current discount percentage (can be negative for premium)',
      discountReason VARCHAR(100) DEFAULT NULL COMMENT 'Reason for discount (e.g., early_bird, last_minute)',
      lastPriceUpdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Last time price was recalculated',

      -- Tour Schedule
      tourStartDate DATE NOT NULL,
      tourEndDate DATE NOT NULL,

      -- Tour Status
      tourStatus ENUM('active', 'inactive', 'cancelled') DEFAULT 'active',

      -- Timestamps
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      -- Indexes for Performance
      INDEX idx_status_date (tourStatus, tourStartDate),
      INDEX idx_price_update (lastPriceUpdate),
      INDEX idx_start_date (tourStartDate),
      INDEX idx_occupancy (bookedSeats, totalCapacity),

      -- Constraints
      CONSTRAINT chk_capacity CHECK (totalCapacity > 0),
      CONSTRAINT chk_booked_seats CHECK (bookedSeats >= 0 AND bookedSeats <= totalCapacity),
      CONSTRAINT chk_prices CHECK (basePrice > 0 AND currentPrice > 0 AND minimumPrice > 0),
      CONSTRAINT chk_price_logic CHECK (minimumPrice <= basePrice),
      CONSTRAINT chk_dates CHECK (tourEndDate >= tourStartDate)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      next();
    } catch (error) {
      console.error("Error creating tour table:", error);
      res.status(500).json({
        message: "Failed to create tour table",
        error: error,
      });
    }
  }

  static async createPriceHistoryTable(
    req: IExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const organizationNumber = req.currentUser?.currentOrganizationNumber;
      await sequelize.query(`CREATE TABLE IF NOT EXISTS price_history_${organizationNumber} (
      id VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      tourId VARCHAR(36) NOT NULL,
      oldPrice DECIMAL(10, 2) NOT NULL,
      newPrice DECIMAL(10, 2) NOT NULL,
      discountPercentage DECIMAL(5, 2) NOT NULL,
      discountReason VARCHAR(100),
      occupancyRate DECIMAL(5, 2),
      daysUntilTour INT,
      changedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_tour_date (tourId, changedAt),
      FOREIGN KEY (tourId) REFERENCES tour_${organizationNumber}(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      next();
    } catch (error) {
      console.error("Error creating price history table:", error);
      res.status(500).json({
        message: "Failed to create price history table",
        error: error,
      });
    }
  }

  static async createBookingsTable(
    req: IExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const organizationNumber = req.currentUser?.currentOrganizationNumber;
      await sequelize.query(`CREATE TABLE IF NOT EXISTS bookings_${organizationNumber} (
      id VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      tourId VARCHAR(36) NOT NULL REFERENCES tour_${organizationNumber}(id) ON DELETE RESTRICT,
      touristId VARCHAR(36) REFERENCES tourist_${organizationNumber}(id) ON DELETE SET NULL,
      numberOfSeats INT NOT NULL,
      pricePerSeat DECIMAL(10, 2) NOT NULL,
      totalAmount DECIMAL(10, 2) NOT NULL,
      bookingStatus ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
      paymentStatus ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
      bookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_tour (tourId),
      INDEX idx_tourist (touristId)

    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      next();
    } catch (error) {
      console.error("Error creating bookings table:", error);
      res.status(500).json({
        message: "Failed to create bookings table",
        error: error,
      });
    }
  }

  static async createCategoryTourTable(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tour_category_${organizationNumber} (
        tourId VARCHAR(36) NOT NULL REFERENCES tour_${organizationNumber}(id) ON DELETE CASCADE,
        categoryId VARCHAR(36) NOT NULL REFERENCES category_${organizationNumber}(id) ON DELETE CASCADE,
        PRIMARY KEY(tourId, categoryId)
      )`);

    res.status(200).json({
      message: "Organization Created Sucessfully",
      organizationNumber,
    });
  }

  static async getOrganization(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const organization = await sequelize.query(
      `SELECT id, organizationName, organizationEmail, organizationPhoneNumber, organizationAddress, organizationLogo, organizationPanNo, organizationVatNo, createdAt FROM organization_${organizationNumber}`,
      {
        type: QueryTypes.SELECT,
      }
    );
    console.log(organization);

    res.status(200).json({
      message: "Organization Fetched Sucessfully",
      data: organization,
    });
  }

  static async updateOrganization(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;

    const {
      organizationName,
      organizationEmail,
      organizationPhoneNumber,
      organizationAddress,
    } = req.body;

    const organizationLogo = req.file?.path;

    if (
      !organizationName ||
      !organizationEmail ||
      !organizationAddress ||
      !organizationPhoneNumber
    ) {
      res.status(400).json({
        message:
          "Please provide organizationName, organizationEmail, organizationPhoneNumber, organizationAddress",
      });
      return;
    }

    // Handle logo update conditionally
    if (organizationLogo) {
      // Update with new logo
      await sequelize.query(
        `UPDATE organization_${organizationNumber} SET organizationName = ?, organizationEmail = ?, organizationPhoneNumber = ?, organizationAddress = ?, organizationLogo = ?`,
        {
          replacements: [
            organizationName,
            organizationEmail,
            organizationPhoneNumber,
            organizationAddress,
            organizationLogo,
          ],
          type: QueryTypes.UPDATE,
        }
      );
    } else {
      // Update without changing logo
      await sequelize.query(
        `UPDATE organization_${organizationNumber} SET organizationName = ?, organizationEmail = ?, organizationPhoneNumber = ?, organizationAddress = ?`,
        {
          replacements: [
            organizationName,
            organizationEmail,
            organizationPhoneNumber,
            organizationAddress,
          ],
          type: QueryTypes.UPDATE,
        }
      );
    }

    res.status(200).json({
      message: "Successfully updated organization",
      data: {
        organizationName,
        organizationEmail,
        organizationPhoneNumber,
        organizationAddress,
        organizationLogo: organizationLogo || null,
      },
    });
  }

  //Delete Organization Feature
}

export default OrganizationController;
