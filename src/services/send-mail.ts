import nodemailer from "nodemailer";
import { envConfig } from "../config/config";

interface IMailInformation {
  to: string;
  subject: string;
  html: string;
}

class SendMailService {
  static async sendMail(mailInformation: IMailInformation) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: envConfig.nodemailerGmail,
        pass: envConfig.nodemailerGmailAppPassword,
      },
    });

    const mailFormatObject = {
      from: "Yatriko Tourism SaaS Platform <yatrikonepal@gmail.com>",
      to: mailInformation.to,
      subject: mailInformation.subject,
      html : mailInformation.html
    };

    try {
      await transporter.sendMail(mailFormatObject);
    } catch (error) {
      console.log(error);
    }
  }
}

export default SendMailService;
