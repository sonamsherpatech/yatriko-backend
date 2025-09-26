import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import User from "../../database/model/user-model";
import UserProvider from "../../../../extra/user-providers-model";
import { envConfig } from "../../config/config";

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
        const email = profile.emails?.[0]?.value;
        const provider = "google";
        const providerAccountId = profile.id;

        let userProvider = await UserProvider.findOne({
          where: { provider, providerAccountId },
          include: [User],
        });

        if (userProvider) {
          return done(null, userProvider.user);
        }

        if (email) {
          let user = await User.findOne({ where: { email } });
          if (!user) {
            user = await User.create({
              username: profile.displayName || email.split("@")[0],
              email,
              password: null,
            });
          }

          await UserProvider.create({
            userId: user.id,
            provider,
            providerAccountId,
            profilePic: profile.photos?.[0]?.value,
            accessToken,
            refreshToken,
          });
          return done(null, user);
        }
        return done(new Error("No email returned from provider"));
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, (user as any).id));
passport.deserializeUser(async (id: string, done) => {
  const u = await User.findByPk(id);
  done(null, u || null);
});

export default passport;
