import { Request, Response } from "express";
import User from "../../../database/model/user-model";
import bcrypt from "bcrypt";

class AuthController {
  static async registerUser(req: Request, res: Response) {
    if (req.body === undefined) {
      res.status(400).json({
        message: "No data is sent",
      });
      return;
    }

    //accept incoming data
    const { username, email, password } = req.body;

    //data processing and checking
    if (!username || !password || !email) {
      res.status(400).json({
        message: "Please Provide username, password and email",
      });
      return;
    }

    //db query --> insert into Users table
    await User.create({
      username: username,
      email: email,
      password: bcrypt.hashSync(password, 12),
    });

    res.status(201).json({
      message: "User registered successfully",
    });
  }
}

export default AuthController;
