import { NextFunction, Request, Response } from "express";
import { envConfig } from "../config/config";
import jwt from "jsonwebtoken";
import User from "../database/model/user-model";
import { IExtendedRequest } from "./type";

class Middleware {
  static isLoggedIn(req: IExtendedRequest, res: Response, next: NextFunction){
    // check if logged in or not
    //token accept
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json({
        message: "please provide token",
      });
      return;
    }
    //token verify
    jwt.verify(
      token,
      envConfig.jsonWebTokenSecretKey!,
      async  (error, result: any) => {
        if (error) {
          res.status(403).json({
            message: "Token Invalid",
          });
          return;
        }
        //search the user using the id coming from the result object
        const userData = await User.findByPk(result.id, {
          attributes: ["id", "currentOrganizationNumber"],
        });

        if (!userData) {
          res.status(403).json({
            message: "No user with that id, Invalid token",
          });
          return;
        }
        req.currentUser = userData;
        next();
      }
    );
  }
}

export default Middleware;
