import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import User from "../database/model/user-model";
import { envConfig } from "./config";

interface GoogleProfile {
  id: string;
  emails: Array<{ value: string; verified: boolean }>;
  displayName: string;
  photos?: Array<{ value: string }>;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: envConfig.googleClientId!,
      clientSecret: envConfig.googleClientSecret!,
      callbackURL: envConfig.googleCallbackURL!,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0].value;

        if (!email) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        let user = await User.findOne({
          where: {
            email,
          },
        });

        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email: email,
            password: null,
            role: "tourist",
            currentOrganizationNumber: null,
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
