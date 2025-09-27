import express, { Router } from "express";
import Middleware from "../../../middleware/middleware";
import OrganizationCategoryController from "../../../controller/orgainzation/category/category-controller";
import ErrorHandlerService from "../../../services/error-handler-service";

const router: Router = express.Router();

router
  .route("/")
  .post(
    Middleware.isLoggedIn,
    ErrorHandlerService.asyncErrorHandler(
      OrganizationCategoryController.createCategory
    )
  )
  .get(
    Middleware.isLoggedIn,
    ErrorHandlerService.asyncErrorHandler(
      OrganizationCategoryController.getCategories
    )
  );

router
  .route("/:id")
  .delete(
    Middleware.isLoggedIn,
    ErrorHandlerService.asyncErrorHandler(
      OrganizationCategoryController.deleteCategory
    )
  )
  .patch(
    Middleware.isLoggedIn,
    ErrorHandlerService.asyncErrorHandler(
      OrganizationCategoryController.updateCategory
    )
  );
export default router;
