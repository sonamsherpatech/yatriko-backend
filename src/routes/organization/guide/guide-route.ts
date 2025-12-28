import express, { Router } from "express";
import Middleware from "../../../middleware/middleware";
import ErrorHandlerService from "../../../services/error-handler-service";
import OrganizationGuideController from "../../../controller/orgainzation/guide/guide-controller";

const router: Router = express.Router();

import multer from "multer";
import { storage } from "../../../services/cloudinary-config";
const upload = multer({
  storage: storage,
});

router
  .route("/")
  .post(
    Middleware.isLoggedIn,
    upload.single("guideImage"),
    ErrorHandlerService.asyncErrorHandler(
      OrganizationGuideController.createGuide
    )
  )
  .get(
    Middleware.isLoggedIn,
    ErrorHandlerService.asyncErrorHandler(OrganizationGuideController.getGuides)
  );

router
  .route("/:id")
  .get(
    Middleware.isLoggedIn,
    ErrorHandlerService.asyncErrorHandler(OrganizationGuideController.getGuide)
  )
  .delete(
    Middleware.isLoggedIn,
    ErrorHandlerService.asyncErrorHandler(
      OrganizationGuideController.deleteGuide
    )
  )
  .patch(
    Middleware.isLoggedIn,
    ErrorHandlerService.asyncErrorHandler(
      OrganizationGuideController.updateGuideStatus
    )
  );

export default router;
