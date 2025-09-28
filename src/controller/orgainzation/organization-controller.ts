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

      const organizationLogo =
        "https://i.pinimg.com/736x/0f/68/94/0f6894e539589a50809e45833c8bb6c4.jpg";

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
      guidePhoneNumber VARCHAR(36) NOT NULL UNIQUE,
      guideAddress VARCHAR(255),
      guideImage VARCHAR(255),
      guideJoinedDate DATE,
      guideSalary VARCHAR(255),
      guidePassword VARCHAR(255),
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
        id VARCHAR(36) PRIMARY KEY,
        tourTitle VARCHAR(255) NOT NULL,
        tourDescription TEXT NOT NULL,
        tourNumberOfPeople VARCHAR(36) NOT NULL,
        tourPrice VARCHAR(255) NOT NULL,
        tourPhoto VARCHAR(255),
        tourDuration VARCHAR(255) NOT NULL,
        tourStartDate Date,
        tourEndDate Date,
        tourStatus ENUM('active', 'inactive','cancelled') DEFAULT 'active',
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
}

export default OrganizationController;
