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
};
