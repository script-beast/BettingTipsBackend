const passport = require("passport");

// const AppleStrategy = require("./Apple");
// const FacebookStrategy = require("./Facebook");
const GoogleStrategy = require("./GoogleAuth");

// passport.use(AppleStrategy);
// passport.use(FacebookStrategy);
// passport.use("google", GoogleStrategy);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;
