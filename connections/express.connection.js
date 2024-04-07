const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const passport = require("passport");
const cookieSession = require("cookie-session");
const passportSetup = require("../utils/PassportSetup");

const initializeTask = require("../initializeTask");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cookieSession({
    name: "session",
    keys: ["key1"],
    maxAge: 24 * 60 * 60 * 1000,
  }),
);

app.set("trust proxy", true);
app.use(passport.initialize());
app.use(passport.session());

app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

const adminRouter = require("../routes/admin.route");
app.use("/admin", adminRouter);

const userRouter = require("../routes/user.route");
app.use("/user", userRouter);

app.use("/test", (req, res) => {
  res.send("Hello World!");
});

app.get("*", (req, res) => {
  res.status(404).json("invalid request");
});

app.use("/", (req, res) => {
  return res.send("working");
});

const startserver = () => {
  try {
    app.listen(PORT, () => {
      initializeTask();
      console.log("Change admin pass");
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = startserver;
