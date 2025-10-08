/**
 * Category-Feature
 * --> Category insert
 * --> Category delete
 * --> Category fetch
 * --> Category update
 */

import { Response } from "express";
import { IExtendedRequest } from "../../../middleware/type";
import sequelize from "../../../database/connection";
import { QueryTypes } from "sequelize";

class OrganizationCategoryController {
  static async createCategory(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;

    const { categoryName, categoryDescription } = req.body;
    if (!categoryName || !categoryDescription) {
      res.status(400).json({
        message: "please provide categoryName and categoryDescription",
      });
      return;
    }

    await sequelize.query(
      `INSERT INTO category_${organizationNumber} (categoryName, categoryDescription) VALUES (?,?)`,
      {
        replacements: [categoryName, categoryDescription],
        type: QueryTypes.INSERT,
      }
    );

    res.status(200).json({
      message: "Category added sucessfully",
    });
  }

  static async getCategories(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;

    const categories = await sequelize.query(
      `SELECT * FROM category_${organizationNumber}`,
      {
        type: QueryTypes.SELECT,
      }
    );

    res.status(200).json({
      data: categories,
      message: "Categories fetched sucessfully",
    });
  }

  static async getCategoryById(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const categoryId = req.params.id;

    const category = await sequelize.query(
      `SELECT * FROM category_${organizationNumber} WHERE id = ?`,
      {
        replacements: [categoryId],
        type: QueryTypes.SELECT,
      }
    );

    res.status(200).json({
      data: category,
      message: "Category Fetched Sucessfully",
    });
  }

  static async deleteCategory(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const id = req.params.id;

    await sequelize.query(
      `DELETE FROM category_${organizationNumber} WHERE id = ?`,
      {
        replacements: [id],
        type: QueryTypes.DELETE,
      }
    );

    res.status(200).json({
      message: "Category deleted sucessfully",
    });
  }

  static async updateCategory(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const id = req.params.id;

    const { categoryName, categoryDescription } = req.body;
    if (!categoryName || !categoryDescription) {
      res.status(400).json({
        message: "Please fill up the data to update",
      });
      return;
    }

    await sequelize.query(
      `UPDATE category_${organizationNumber} set categoryName = ?, categoryDescription= ? WHERE id = ?`,
      {
        replacements: [categoryName, categoryDescription, id],
        type: QueryTypes.UPDATE,
      }
    );

    res.status(200).json({
      message: "Category updated sucessfully",
    });
  }
}

export default OrganizationCategoryController;
