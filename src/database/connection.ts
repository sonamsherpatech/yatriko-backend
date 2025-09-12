import { Sequelize } from "sequelize-typescript";
import { envConfig } from "../config/config";
const sequelize = new Sequelize({
  database: envConfig.databaseName,
  username: envConfig.databaseUsername,
  password: envConfig.databasePassword,
  host: envConfig.databaseHost,
  port: Number(envConfig.databasePort),
  dialect: "mysql",
  models: [__dirname + "/model"],
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Authenticated, Connection");
  })
  .catch((error) => {
    console.log(error);
  });

sequelize.sync({ alter: false }).then(() => {
  console.log("Migration Successsfull");
});

export default sequelize;
