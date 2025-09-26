import { config } from "dotenv";
config();

export const envConfig = {
  // PORT Number
  portNumber: process.env.PORT,

  //DB Configuartion
  databaseName: process.env.DB_NAME,
  databaseUsername: process.env.DB_USERNAME,
  databasePassword: process.env.DB_PASSWORD,
  databaseHost: process.env.DB_HOST,
  databasePort: process.env.DB_PORT,

  //Google Configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackURL: process.env.GOOGLE_CALLBACK_URL,

  //Frontend_URL
  frontendURL: process.env.FRONTEND_URL,

  //jwt
  jsonWebTokenSecretKey: process.env.JWT_SECRET_KEY,
  jsonExpiresIn: process.env.JWT_EXPIRES_IN,

  //node-env
  nodeENV: process.env.NODE_ENV,

  //cloudinary configuration
  cloudinarySecretKey: process.env.CLOUDINARY_SECRET_KEY,
  cloudinaryAPIKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
};
