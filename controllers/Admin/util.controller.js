const packageModel = require("../../models/package.model");
const userModel = require("../../models/user.model");

const sendAllPackage = require("../../utils/MailService/sendAllPackageMsg.utils");
const sendCustomMsg = require("../../utils/MailService/sendCustomMsg.utils");

const routes = {};

routes.bulkPackageMail = async (req, res) => {
  // const { title, data } = req.body;

  try {
    const users = await userModel.find({ isVerified: true, status: "active" });
    const allActivePackages = await packageModel.find({ status: "active" });

    const data = allActivePackages.filter((item) => {
      return new Date(item.endDate) > Date.now();
    });

    users.forEach(async (user) => {
      await sendAllPackage(
        user.email,
        user.name,
        "Jordanspicks.com packages out NOW!",
        data,
      );
    });

    return res.status(201).json({ msg: "success" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

routes.bulkCustomMail = async (req, res) => {
  const { data } = req.body;

  try {
    const users = await userModel.find({ isVerified: true, status: "active" });

    users.forEach(async (user) => {
      await sendCustomMsg(
        user.email,
        user.name,
        data,
        "Jordanspicks.com packages out NOW!",
      );
    });

    return res.status(201).json({ msg: "success" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

routes.directupdate = async (req, res) => {
  try {
    const user = await userModel.find();

    user.forEach(async (item) => {
      // refferal code
      const referralCode = Math.random()
        .toString(36)
        .substring(2, 12)
        .toUpperCase();

      // add in every user

      await userModel.findOneAndUpdate(
        { _id: item._id },
        { referralCode },
        { new: true },
      );
    });

    return res.status(201).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

module.exports = routes;
