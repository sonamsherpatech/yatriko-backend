import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport";

const app = express();

import { envConfig } from "./config/config";
import authRoute from "./routes/globals/auth/auth-route";
import organizationRoute from "./routes/organization/organization-route";
import organizationCategoryRoute from "./routes/organization/category/category-route";
import organizationTourRoute from "./routes/organization/tour/tour-route";
import organizationGuideRoute from "./routes/organization/guide/guide-route";

// Body parser - FIRST
app.use(express.json());

// CORS - SECOND
app.use(
  cors({
    origin: envConfig.frontendURL,
    credentials: true,
  })
);

// Session middleware - THIRD (BEFORE passport)
app.use(
  session({
    secret: envConfig.sessionSecret!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: envConfig.nodeENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Passport initialization - FOURTH (AFTER session, BEFORE routes)
app.use(passport.initialize());
app.use(passport.session());

// Routes - LAST
// AUTH ROUTE - incaludes both /api/register, /api/login, AND /api/google
app.use("/api", authRoute);

// Organization ROUTES
app.use("/api/organization", organizationRoute);
app.use("/api/organization/category", organizationCategoryRoute);
app.use("/api/organization/tour", organizationTourRoute);
app.use("/api/organization/guide", organizationGuideRoute);

export default app;