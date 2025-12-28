import express, { Request, Response, Router } from "express";
import AuthController from "../../../controller/globals/auth/auth-controller";
import passport from "../../../config/passport";
import { envConfig } from "../../../config/config";
import GenerateJWTTokenServices from "../../../services/generate-jwt-token";

const router: Router = express.Router();

// DEBUG ROUTE - Add this to check configuration
router.route("/debug").get((req: Request, res: Response) => {
  res.json({
    googleClientId: envConfig.googleClientId,
    googleCallbackURL: envConfig.googleCallbackURL,
    frontendURL: envConfig.frontendURL,
    port: envConfig.portNumber || process.env.PORT,
    nodeEnv: envConfig.nodeENV,
  });
});

router.route("/register").post(AuthController.registerUser);
router.route("/login").post(AuthController.loginUser);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${envConfig.frontendURL}/auth/login?error=google_auth_failed`,
    session: false,
  }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;

      if (!user) {
        return res.redirect(
          `${envConfig.frontendURL}/auth/login?error=authentication_failed`
        );
      }

      const token = GenerateJWTTokenServices.generateJWTToken({ id: user.id });

      res.redirect(`${envConfig.frontendURL}/callback?token=${token}`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(
        `${envConfig.frontendURL}/auth/login?error=authentication_failed`
      );
    }
  }
);
export default router;
