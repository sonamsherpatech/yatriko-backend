import express, { Request, Router } from "express";
import OrganizationController from "../../controller/orgainzation/organization-controller";
import Middleware from "../../middleware/middleware";
import ErrorHandlerService from "../../services/error-handler-service";

// import { multer, storage } from "./../../middleware/multer-middleware";
// const upload = multer({
//   storage: storage,
// });
// import multer from "multer";

// import { cloudinary, storage } from "../../services/cloudinary-config";
// const upload = multer({
//   storage: storage,
//   fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
//     const allowFileTypes = ["image/png", "image/jpeg", "image/jpg"];
//     if (allowFileTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image support"));
//     }
//   },
  
// });

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
