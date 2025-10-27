import express, { Router } from "express";
import TourController from "../../../controller/orgainzation/tour/tour-controller";
import Middleware from "../../../middleware/middleware";
import ErrorHandlerService from "../../../services/error-handler-service";

const router: Router = express.Router();

import multer from "multer";
import { storage } from "./../../../services/cloudinary-config";
const upload = multer({ storage: storage });

router
  .route("/")
  .post(
    Middleware.isLoggedIn,
    upload.single("tourPhoto"),
    ErrorHandlerService.asyncErrorHandler(TourController.createTour)
  )
  .get(
    Middleware.isLoggedIn,
    ErrorHandlerService.asyncErrorHandler(TourController.getTours)
  );

router
  .route("/:id")
  .delete(
    Middleware.isLoggedIn,
    ErrorHandlerService.asyncErrorHandler(TourController.deleteTour)
  )
  .get(
    Middleware.isLoggedIn,
    ErrorHandlerService.asyncErrorHandler(TourController.getSingleTour)
  )
  .patch(
    Middleware.isLoggedIn,
    upload.single("tourPhoto"),
    ErrorHandlerService.asyncErrorHandler(TourController.updateTour)
  );

export default router;
