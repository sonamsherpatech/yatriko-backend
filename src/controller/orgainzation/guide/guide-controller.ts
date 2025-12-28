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

    console.log(req.file);
    const guideImage = req.file
      ? req.file.path
      : "https://imgs.search.brave.com/-Q4gc0dPWnhnl8AHIbgIZb8k0-WNm52-G2dG2EdNhw4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/dmVjdG9yc3RvY2su/Y29tL2kvNTAwcC8y/Ni8zOS9wcm9maWxl/LXBsYWNlaG9sZGVy/LWltYWdlLWdyYXkt/c2lsaG91ZXR0ZS12/ZWN0b3ItMjIxMjI2/MzkuanBn ";

    const data = GeneratePasswordService.generateRandomPassword(guideName);
    await sequelize.query(
      `INSERT INTO guide_${organizationNumber} (guideName, guideEmail, guidePhoneNumber, guideImage, guideAddress, guideSalary, guidePassword) VALUES (?,?,?,?,?,?,?)`,
      {
        replacements: [
          guideName,
          guideEmail,
          guidePhoneNumber,
          guideImage,
          guideAddress,
          guideSalary,
          data.hashedVersion,
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

    await sequelize.query(
      `UPDATE guide_${organizationNumber} SET tourId = ? WHERE id = ?`,
      {
        replacements: [tourId, guideData[0].id],
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
                <td>${data.plainVersion}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Organization Number:</td>
                <td>${organizationNumber}</td>
              </tr>
            </table>

            <p style="margin-top: 20px;">For security purposes, we highly recommend changing your password after your first login.</p>

            <a href="https://yourwebsite.com/login"
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
    });
  }

  //get all guide
  static async getGuides(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;

    const guides = await sequelize.query(
      `SELECT id, guideName, guideEmail, guideJoinedDate, guideStatus FROM guide_${organizationNumber}`,
      {
        type: QueryTypes.SELECT,
      }
    );

    res.status(200).json({
      data: guides,
      message: "Guide fetched sucessfully",
    });
  }

  //delete guide
  static async deleteGuide(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const guideId = req.params.id;

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
  static async updateGuideStatus(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const guideId = req.params.id;

    const { guideStatus } = req.body;

    await sequelize.query(
      `UPDATE guide_${organizationNumber} SET guideStatus = ? WHERE id = ?`,
      {
        replacements: [guideStatus, guideId],
        type: QueryTypes.UPDATE,
      }
    );

    res.status(200).json({
      message: "Guide Status Updated Sucessfully",
    });
  }

  //select individual guide
  static async getGuide(req: IExtendedRequest, res: Response) {
    const organizationNumber = req.currentUser?.currentOrganizationNumber;
    const guideId = req.params.id;

    const guide = await sequelize.query(
      `SELECT g.id, g.guideName, g.guideEmail, g.guidePhoneNumber, g.guideAddress, g.guideImage, g.guideJoinedDate, g.guideSalary, g.guideStatus, g.createdAt, g.tourId, t.tourTitle FROM guide_${organizationNumber} as g JOIN tour_${organizationNumber} as t ON g.tourId = t.id WHERE g.id = ?`,
      {
        replacements: [guideId],
        type: QueryTypes.SELECT,
      }
    );

    res.status(200).json({
      data: guide,
      message: "Guide fetched sucessfully",
    });
  }
}

export default OrganizationGuideController;
