import { Request, Response } from "express";
import User from "../../../database/model/user-model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { envConfig } from "../../../config/config";

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

  static async loginUser(req: Request, res: Response) {
    const { email, password } = req.body;

    // Check if all required incoming data has arrived
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }

    // Check if email is in User table
    const data = await User.findAll({
      where: {
        email,
      },
    });

    if (data.length === 0) {
      return res.status(404).json({
        message: "Invalid Credential",
      });
    }

    // Check password
    const isPasswordMatch = bcrypt.compareSync(password, data[0].password);
    if (!isPasswordMatch) {
      return res.status(403).json({
        message: "Invalid Credential",
      });
    }

    //generate token using jwt
    //@ts-ignore
    const token = jwt.sign(
      { id: data[0].id },
      envConfig.jsonWebTokenSecretKey!,
      {
        expiresIn: envConfig.jsonExpiresIn,
      }
    );
    res.status(200).json({
      data: {
        username: data[0].username,
      },
      token,
      message: "Sucessfully Login",
    });
  }
}

export default AuthController;

/**
 * Login user Algo
 * accept incoming email rw password
 *
 * first check email if it exists on user table
 * if not sent error message
 * if yes
 *
 * check password --> bcrypt.compareSync()
 * if not matched --> send error saying invalid credentials
 *
 * if matached
 * token generation via JWT
 *
 */
