import jwt from "jsonwebtoken";
import { envConfig } from "../config/config";
class GenerateJWTTokenServices {
  static generateJWTToken(data: { id: string }) {
    //@ts-ignore
    const token = jwt.sign(data, envConfig.jsonWebTokenSecretKey, {
      expiresIn: envConfig.jsonExpiresIn,
    });
    return token;
  }
}

export default GenerateJWTTokenServices;
