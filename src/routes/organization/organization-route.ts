import express, { Router } from "express";
import OrganizationController from "../../controller/orgainzation/organization-controller";
import Middleware from "../../middleware/middleware";
import ErrorHandlerService from "../../services/error-handler-service";

import { multer, storage } from "./../../middleware/multer-middleware";
const upload = multer({
  storage: storage,
});

const router: Router = express.Router();

router
  .route("/")
  .post(
    Middleware.isLoggedIn,
    OrganizationController.createOrganization,
    OrganizationController.createGuideTable,
    OrganizationController.createTouristTable,
    OrganizationController.createCategoryTable,
    ErrorHandlerService.asyncErrorHandler(
      OrganizationController.createTourTable
    )
  );

export default router;
