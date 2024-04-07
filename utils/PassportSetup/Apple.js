const passport = require("passport");
const AppleStrategy = require("passport-apple");

passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      callbackURL: "/user/auth/apple/callback",
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) =>
      done(null, profile),
  ),
);

module.exports = passport;
