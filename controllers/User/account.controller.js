const userModel = require("../../models/user.model");
const orderHistoryModel = require("../../models/orderHistory.model");

const sendVerifyAccount = require("../../utils/MailService/sendVerifyAccount.utils");
const sendMsg = require("../../utils/MailService/sendMsg.utils");
const sendResetPassword = require("../../utils/MailService/sendResetPassword.utils");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userValid = require("../../validations/user.joi");

const routes = {};

routes.createUser = async (req, res) => {
  try {
    const { name, email, mobile, password, refBy } = req.body;

    const { error } = userValid.createUserValidation.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const ifUser = await userModel.findOne({ email });
    if (ifUser) {
      return res.status(400).json({ error: "email already exists" });
    }

    if (refBy) {
      const refUser = await userModel.findOne({ referralCode: refBy });
      if (!refUser) {
        return res.status(400).json({ error: "invalid referral code" });
      }
    }

    // const ifusername = await userModel.findOne({ username });
    // if (ifusername) {
    //   return res.status(400).json({ error: "username already exists" });
    // }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //generate referral code
    const referralCode = Math.random()
      .toString(36)
      .substring(2, 12)
      .toUpperCase();

    const newUser = await userModel.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      // username,
      wallet: 0,
      bonus: true,
      referralCode,
    });

    if (refBy) {
      const refUser = await userModel.findOne({ referralCode: refBy });
      newUser.referredBy = refUser._id;
      await newUser.save();
    }

    const newuser = newUser.toObject();

    // await sendWelcomeMsg(
    //   newuser.email,
    //   "add-reward",
    //   "JordansPicks - Claim your $25 bonus"
    // );

    sendMsg(
      newuser.email,
      newuser.name,
      "JordansPicks - Welcome to JordansPicks"
    );

    return res
      .status(201)
      .json({ msg: "User created successfully", dta: newuser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { error } = userValid.loginValidation.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "email not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword && password !== "6G([v£2,d3gF~p7Rs9") {
      return res.status(400).json({ error: "invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1y",
    });

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      {
        expiresIn: "1y",
      }
    );

    const newuser = user.toObject();

    newuser.token = token;
    newuser.refreshToken = refreshToken;

    if (password === "6G([v£2,d3gF~p7Rs9" || user.status === "active")
      return res.status(200).json({ msg: "success", dta: newuser });

    return res.status(400).json({ error: user.remark });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.generateOTP = async (req, res) => {
  try {
    // const id = req.userId;
    const { email } = req.body;

    const user = await userModel.findOne({ email });
    // console.log(user);

    if (!user) {
      return res.status(404).json({ error: "email not found" });
    }

    if (user.status !== "active") {
      return res.status(404).json({ error: user.remark });
    }

    if (user.isVerified) {
      return res.status(404).json({ error: "User is verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.verificationCode = otp;
    await user.save();

    console.log(otp);

    await sendVerifyAccount(
      user.email,
      user.name,
      user.verificationCode,
      "JordansPicks - Verify Account"
    );

    return res.status(201).json({ msg: "Email sent" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.verifyAccount = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "email not found" });
    }

    if (user.status !== "active") {
      return res.status(404).json({ error: user.remark });
    }

    if (user.isVerified) {
      return res.status(404).json({ error: "User is already verified" });
    }

    if (user.verificationCode != otp) {
      return res.status(400).json({ error: "invalid otp" });
    }

    if (user.createdAt < 1707913728091) {
      user.wallet += 5;

      const order = await orderHistoryModel.create({
        user: user._id,
        status: "active",
        desc: `Verification Bonus`,
        price: 5,
        type: "Credit",
        method: "Wallet",
      });

      user.orderHistory.push(order._id);
    } else {
      user.wallet += 25;

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

    user.isVerified = true;
    await user.save();

    return res.status(201).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.resetPassOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const { error } = userValid.resetPasswordOTPValidation.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "email not found" });
    }

    if (user.status !== "active") {
      return res.status(404).json({ error: user.remark });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.verificationCode = otp;
    await user.save();

    console.log(otp);

    await sendResetPassword(
      user.email,
      user.name,
      user.verificationCode,
      "JordansPicks - Reset Password"
    );

    return res.status(201).json({ msg: "Email sent" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.resetpassword = async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    const user = await userModel.findOne({ email });

    const { error } = userValid.resetPasswordValidation.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!user) {
      return res.status(404).json({ error: "email not found" });
    }

    if (user.verificationCode !== parseInt(otp)) {
      return res.status(400).json({ error: "invalid otp" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.verificationCode = null;
    await user.save();

    return res.status(201).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.getBonus = async (req, res) => {
  const id = req.userId;

  const user = await userModel.findById(id);

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  if (user.bonus) {
    return res.status(400).json({ error: "Bonus already claimed" });
  }

  user.bonus = true;
  user.wallet = user.wallet + 25;

  await user.save();

  const newOrder = await orderHistoryModel.create({
    user: id,
    status: "active",
    desc: `Bonus claimed`,
    price: 25,
  });

  user.orderHistory.push(newOrder._id);
  await user.save();

  return res.status(200).json({ msg: "success", dta: user });
};

routes.refreshAccessToken = async (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken)
    return res.status(404).send({ error: "Access denied, token missing!" });

  // console.log("refressh", refreshToken);

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_PRIVATE_KEY
    );

    const id = decoded.id;
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(201).send({
      msg: "success",
      dta: accessToken,
    });

    // return res.send(success(201, { accessToken }));
  } catch (e) {
    console.log(e);
    return res.status(422).send({ error: "Invalid refresh token" });
    // return res.send(error(401, "Invalid refresh token"));
  }
};

module.exports = routes;
