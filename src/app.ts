import express from "express";
import cors from "cors";
const app = express();

import { envConfig } from "./config/config";
import authRoute from "./routes/globals/auth/auth-route";
import organizationRoute from "./routes/organization/organization-route";
import organizationCategoryRoute from "./routes/organization/category/category-route";
import organizationTourRoute from "./routes/organization/tour/tour-route";
import organizationGuideRoute from "./routes/organization/guide/guide-route";

// import googleAuthRoute from "./routes/google-auth/auth-route";
// import cookieParser from "cookie-parser";
// import passport from "./services/auth/passport";

app.use(express.json());
// app.use(cookieParser());
// app.use(passport.initialize());

app.use(
  cors({
    origin: envConfig.frontendURL,
    credentials: true,
  })
);

//AUTH ROUTE
app.use("/api", authRoute);

//Organization ROUTE
app.use("/api/organization", organizationRoute);
app.use("/api/organization/category", organizationCategoryRoute);
app.use("/api/organization/tour", organizationTourRoute);
app.use("/api/organization/guide", organizationGuideRoute);

//GOOGLE AUTH ROUTE
// app.use("/auth",googleAuthRoute)

export default app;
