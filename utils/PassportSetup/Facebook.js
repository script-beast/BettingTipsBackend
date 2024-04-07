const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/user/auth/facebook/callback",
      profileFields: ["id", "email", "name"],
    },
    async (accessToken, refreshToken, profile, done) => done(null, profile),
  ),
);

module.exports = passport;
