const userModel = require("../../models/user.model");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const routes = {};

routes.google = passport.authenticate("google", {
  scope: ["profile"],
});

routes.googleCallback = passport.authenticate("google", {
  session: false,
  failureRedirect: "/user/auth/google",
  successRedirect: "/user/auth/success",
});

routes.facebook = passport.authenticate("facebook", {
  scope: ["email"],
});

routes.facebookCallback = passport.authenticate("facebook", {
  session: false,
  failureRedirect: "/user/auth/facebook",
  successRedirect: "/user/auth/success",
});

routes.apple = passport.authenticate("apple", {
  scope: ["email"],
});

routes.appleCallback = passport.authenticate("apple", {
  session: false,
  failureRedirect: "/user/auth/apple",
  successRedirect: "/user/auth/success",
});

routes.redirect = (req, res) => {
  res.redirect("/");
};

routes.success = async (req, res) => {
  try {
    console.log(req);
    console.log(req.user.id);
    if (req.user) {
      const user = req.user._json;

      const userExists = await userModel.findOne({ email: user.email });

      if (userExists) {
        if (userExists.status !== "active") {
          return res.status(404).json({ error: user.remark });
        }

        if (!user.isVerified) {
          user.wallet += 25;
          user.isVerified = true;

          const order = await orderHistoryModel.create({
            user: user._id,
            status: "active",
            desc: `Signup Bonus`,
            price: 25,
            type: "Credit",
            method: "Wallet",
          });

          if (user.referredBy) {
            user.wallet += 25;

            const rorder = await orderHistoryModel.create({
              user: user._id,
              status: "active",
              desc: `Referral Bonus`,
              price: 25,
              type: "Credit",
              method: "Wallet",
            });

            user.orderHistory.push(rorder._id);
          }

          user.orderHistory.push(order._id);
        }

        const token = jwt.sign(
          { user: userExists._id },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        const refreshToken = jwt.sign(
          { user: userExists._id },
          process.env.REFRESH_TOKEN_PRIVATE_KEY,
          { expiresIn: "1y" }
        );

        res.redirect(
          process.env.APP_URL +
            "auth/social?token=" +
            token +
            "&refreshToken=" +
            refreshToken
        );
      } else {
        const newUser = new userModel({
          name: user.name,
          email: user.email,
        });

        const savedUser = await newUser.save();

        const token = jwt.sign(
          { user: savedUser._id },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );
        const refreshToken = jwt.sign(
          { user: savedUser._id },
          process.env.REFRESH_TOKEN_PRIVATE_KEY,
          { expiresIn: "1y" }
        );

        res.redirect(
          process.env.APP_URL +
            "auth/social?token=" +
            token +
            "&refreshToken=" +
            refreshToken
        );
      }
    } else res.status(401).json("Unauthorized");
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal Server Error");
  }
};

routes.logout = (req, res) => {
  res.clearCookie("token");
  res.redirect(process.env.REDIRECT_URL);
};

module.exports = routes;
