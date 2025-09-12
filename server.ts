import app from "./src/app";
import { envConfig } from "./src/config/config";
import "./src/database/connection";

const port = envConfig.portNumber;
function startServer() {
  app.listen(port, () => {
    console.log(`The project is running at ${port}`);
  });
}
startServer();
