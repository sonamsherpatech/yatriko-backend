import { Response } from "express";
import { IExtendedRequest } from "../../../middleware/type";
import sequelize from "../../../database/connection";
import GeneratePasswordService from "../../../services/genereate-random-password";
import { QueryTypes } from "sequelize";
import SendMailService from "../../../services/send-mail";

class OrganizationGuideController {
  // create guide function
  static async createGuide(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const {
      guideName,
      guideEmail,
      guidePhoneNumber,
      guideAddress,
      guideSalary,
      tourId,
    } = req.body;

    if (!guideName || !guideEmail || !guidePhoneNumber) {
      res.status(400).json({
        message: "please provide guideName, guideEmail, guidePhoneNumber",
      });
      return;
    }

    const existingGuide = await sequelize.query(
      `SELECT id FROM guide_${organizationNumber} WHERE guideEmail = ?`,
      {
        replacements: [guideEmail],
        type: QueryTypes.SELECT,
      }
    );

    if (existingGuide.length > 0) {
      return res.status(400).json({
        message: "A guide with this email already exists",
      });
    }

    const guideImage = req.file
      ? req.file.path
      : "https://imgs.search.brave.com/-Q4gc0dPWnhnl8AHIbgIZb8k0-WNm52-G2dG2EdNhw4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/dmVjdG9yc3RvY2su/Y29tL2kvNTAwcC8y/Ni8zOS9wcm9maWxl/LXBsYWNlaG9sZGVy/LWltYWdlLWdyYXkt/c2lsaG91ZXR0ZS12/ZWN0b3ItMjIxMjI2/MzkuanBn ";

    const passwordData =
      GeneratePasswordService.generateRandomPassword(guideName);

    await sequelize.query(
      `INSERT INTO guide_${organizationNumber} (guideName, guideEmail, guidePhoneNumber, guideImage, guideAddress, guideSalary, guidePassword, tourId) VALUES (?,?,?,?,?,?,?,?)`,
      {
        replacements: [
          guideName,
          guideEmail,
          guidePhoneNumber,
          guideImage,
          guideAddress || null,
          guideSalary || null,
          passwordData.hashedVersion,
          tourId || null,
        ],
        type: QueryTypes.INSERT,
      }
    );

    const guideData: { id: string }[] = await sequelize.query(
      `SELECT id FROM guide_${organizationNumber} WHERE guideEmail = ?`,
      {
        replacements: [guideEmail],
        type: QueryTypes.SELECT,
      }
    );

    //send mail
    const mailInformation = {
      to: guideEmail,
      subject: "Welcome to Yatriko Tourism Platform",
      html: `
      <div style="font-family: Arial, sans-serif; background: #f4f6f8; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden;">

          <div style="background: #0a6cff; padding: 20px; text-align: center; color: #ffffff;">
            <h2 style="margin:0;">Welcome to Yatriko Tourism Platform</h2>
          </div>

          <div style="padding: 25px; color: #333333; line-height: 1.6;">
            <p>Namaste <strong>${guideName}</strong>,</p>

            <p>We're excited to welcome you to <strong>Yatriko Tourism Platform</strong> as one of our valuable guides.
            Below are your login credentials to access your guide account:</p>

            <table style="margin-top: 20px;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Email:</td>
                <td>${guideEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Password:</td>
                <td>${passwordData.plainVersion}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Organization Number:</td>
                <td>${organizationNumber}</td>
              </tr>
            </table>

            <p style="margin-top: 20px;">For security purposes, we highly recommend changing your password after your first login.</p>

            <a href="http://localhost:4000/guide/login"
              style="display: inline-block; margin-top: 20px; padding: 12px 20px; background: #0a6cff; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Login to Dashboard
            </a>

            <p style="margin-top: 30px;">If you have any questions or need help, feel free to contact us.</p>

            <p>Best Regards,<br><strong>Yatriko Tourism Team</strong></p>
          </div>

          <div style="background: #f0f0f0; text-align: center; padding: 12px; font-size: 12px; color:#666;">
            © 2025 Yatriko Tourism Platform. All rights reserved.
          </div>

        </div>
      </div>`,
    };

    await SendMailService.sendMail(mailInformation);

    res.status(200).json({
      message: "Guide Created Sucessfully",
      data: {
        guideId: guideData[0].id,
        guideName,
        guideEmail,
      },
    });
  }

  //get all guide
  static async getGuides(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;

    const guides = await sequelize.query(
      `SELECT 
        g.id, 
        g.guideName, 
        g.guideEmail, 
        g.guidePhoneNumber, 
        g.guideImage, 
        g.guideAddress, 
        g.guideSalary, 
        g.guideJoinedDate, 
        g.guideStatus, 
        g.tourId, 
        t.tourTitle as assignedTourTitle, 
        t.tourStartDate as tourStartDate, 
        t.tourEndDate as tourEndDate 
      FROM guide_${organizationNumber} as g
      LEFT JOIN tour_${organizationNumber} as t ON g.tourId = t.id
      ORDER BY g.createdAt DESC`,

      {
        type: QueryTypes.SELECT,
      }
    );

    const stats = {
      total: guides.length,
      active: guides.filter((g: any) => g.guideStatus === "active").length,
      inactive: guides.filter((g: any) => g.guideStatus === "inactive").length,
      suspended: guides.filter((g: any) => g.guideStatus === "suspended")
        .length,
      assigned: guides.filter((g: any) => g.tourId !== null).length,
      available: guides.filter((g: any) => g.tourId === null).length,
    };

    res.status(200).json({
      data: guides,
      stats: stats,
      message: "Guide fetched sucessfully",
    });
  }

  //delete guide
  static async deleteGuide(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const guideId = req.params.id;

    if (!guideId) {
      return res.status(400).json({
        message: "Guide ID is required",
      });
    }

    const guide = (await sequelize.query(
      `SELECT id, tourId FROM guide_${organizationNumber} WHERE id = ?`,
      {
        replacements: [guideId],
        type: QueryTypes.UPDATE,
      }
    )) as any[];

    if (guide.length === 0) {
      return res.status(404).json({
        message: "Guide not found",
      });
    }

    if (guide[0].tourId) {
      return res.status(400).json({
        message: "Cannot delete guide assined to tour. Please Unassign first",
      });
    }

    await sequelize.query(
      `DELETE FROM guide_${organizationNumber} WHERE id = ?`,
      {
        replacements: [guideId],
        type: QueryTypes.DELETE,
      }
    );

    res.status(200).json({
      message: "Category deleted sucessfully",
    });
  }

  //change status of guide
  static async updateGuide(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const guideId = req.params.id;

    const {
      guideName,
      guideEmail,
      guidePhoneNumber,
      guideAddress,
      guideSalary,
      guideStatus,
      tourId,
    } = req.body;

    if (!guideId) {
      return res.status(400).json({
        message: "Guide ID is required",
      });
    }

    const existingGuide = await sequelize.query(
      `SELECT id FROM guide_${organizationNumber} WHERE id = ?`,
      {
        replacements: [guideId],
        type: QueryTypes.SELECT,
      }
    );

    if (existingGuide.length === 0) {
      return res.status(404).json({
        message: "Guide Not found",
      });
    }

    let updateQuery = `UPDATE guide_${organizationNumber} SET `;
    const replacements: any[] = [];
    const updates: string[] = [];

    if (guideName) {
      updates.push("guideName = ?");
      replacements.push(guideName);
    }
    if (guideEmail) {
      updates.push("guideEmail = ?");
      replacements.push(guideEmail);
    }
    if (guidePhoneNumber) {
      updates.push("guidePhoneNumber = ?");
      replacements.push(guidePhoneNumber);
    }
    if (guideAddress !== undefined) {
      updates.push("guideAddress = ?");
      replacements.push(guideAddress);
    }
    if (guideSalary !== undefined) {
      updates.push("guideStatus = ?");
      replacements.push(guideSalary);
    }
    if (guideStatus) {
      updates.push("guideStatus = ?");
      replacements.push(guideStatus);
    }
    if (tourId !== undefined) {
      updates.push("tourId = ?");
      replacements.push(tourId);
    }
    if (req.file) {
      updates.push("guideImage = ?");
      replacements.push(req.file.path);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "No fields to update",
      });
    }

    updateQuery += updates.join(", ") + " WHERE id = ?";
    replacements.push(guideId);

    await sequelize.query(updateQuery, {
      replacements,
      type: QueryTypes.UPDATE,
    });

    res.status(200).json({
      message: "Guide Status Updated Sucessfully",
    });
  }

  static async updateGuideStatus(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const guideId = req.params.id;
    const { guideStatus } = req.body;

    if (
      !guideStatus ||
      !["active", "inactive", "suspended"].includes(guideStatus)
    ) {
      return res.status(400).json({
        message:
          "Valid guide status is required (active, inactive, or suspended)",
      });
    }

    try {
      const result = await sequelize.query(
        `UPDATE guide_${organizationNumber} SET guideStatus = ? WHERE id = ?`,
        {
          replacements: [guideStatus, guideId],
          type: QueryTypes.UPDATE,
        }
      );

      res.status(200).json({
        message: "Guide status updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating guide status:", error);
      res.status(500).json({
        message: "Failed to update guide status",
        error: error.message,
      });
    }
  }

  //select individual guide
  static async getGuide(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const guideId = req.params.id;

    const guide = await sequelize.query(
      `SELECT 
        g.id, 
        g.guideName, 
        g.guideEmail, 
        g.guidePhoneNumber, 
        g.guideAddress, 
        g.guideImage, 
        g.guideJoinedDate, 
        g.guideSalary, 
        g.guideStatus, 
        g.createdAt, 
        g.tourId, 
        t.tourTitle,
        t.tourStartDate,
        t.tourEndDate,
        t.tourStatus,
        t.tourDuration
      FROM guide_${organizationNumber} as g 
      LEFT JOIN tour_${organizationNumber} as t ON g.tourId = t.id 
      WHERE g.id = ?`,
      {
        replacements: [guideId],
        type: QueryTypes.SELECT,
      }
    );

    if (!guide || guide.length === 0) {
      return res.status(400).json({
        message: "Guide not found",
      });
    }

    res.status(200).json({
      data: guide[0],
      message: "Guide fetched sucessfully",
    });
  }

  //asign guide to tour
  static async assignGuideToTour(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const { guideId, tourId } = req.body;

    if (!guideId || !tourId) {
      return res.status(400).json({
        message: "Guide ID and Tour ID are required",
      });
    }

    const guide = (await sequelize.query(
      `SELECT id,guideStatus, tourId FROM guide_${organizationNumber} WHERE id = ?`,
      {
        replacements: [guideId],
        type: QueryTypes.SELECT,
      }
    )) as any[];

    if (guide.length === 0) {
      return res.status(404).json({
        message: "Guide not found",
      });
    }

    if (guide[0].guideStatus !== "active") {
      return res.status(400).json({
        message: "Guide must be active to be assigned to tour",
      });
    }

    if (guide[0].tourId) {
      return res.status(400).json({
        message: "Guide is already assigned to another tour",
      });
    }

    const tour = await sequelize.query(
      `SELECT id FROM tour_${organizationNumber} WHERE id = ?`,
      {
        replacements: [tourId],
        type: QueryTypes.SELECT,
      }
    );

    if (tour.length === 0) {
      return res.status(404).json({
        message: "Tour not found",
      });
    }

    await sequelize.query(
      `UPDATE guide_${organizationNumber} SET tourId = ? WHERE id = ?`,
      {
        replacements: [tourId, guideId],
        type: QueryTypes.UPDATE,
      }
    );

    res.status(200).json({
      message: "Guide assigned to tour sucessfully",
    });
  }

  static async unassignGuideFromTour(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const guideId = req.params.id;

    if (!guideId) {
      return res.status(400).json({
        message: "Guide Id is required",
      });
    }

    await sequelize.query(
      `UPDATE guide_${organizationNumber} SET tourId = NULL WHERE id = ?`,
      {
        replacements: [guideId],
        type: QueryTypes.UPDATE,
      }
    );

    res.status(200).json({
      message: "Guide unassigned from tour sucessfully",
    });
  }

  static async getAvailableGuides(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const guides = await sequelize.query(
      `SELECT
        id,
        guideName,
        guideEmail,
        guidePhoneNumber,
        guideImage,
        guideSalary,
        guideJoinedDate
      FROM guide_${organizationNumber}
      WHERE guideStatus = 'active' AND tourId IS NULL
      ORDER BY guideName ASC`,
      {
        type: QueryTypes.SELECT,
      }
    );

    res.status(200).json({
      data: guides,
      count: guides.length,
      message: "Available guides fetched sucessfully",
    });
  }
}

export default OrganizationGuideController;
