const contactModel = require("../../models/contact.model");
const orderHistoryModel = require("../../models/orderHistory.model");
const packageModel = require("../../models/package.model");
const vslPackageModel = require("../../models/vslPackage.model");
const userModel = require("../../models/user.model");
const specialPackageModel = require("../../models/specialPackage.model");

const routes = {};

routes.overview = async (req, res) => {
  try {
    const users = await userModel.find({ isVerified: true });
    const totaluser = await userModel.find();
    const contacts = await contactModel.find();
    const packages = await packageModel.find();
    const vslPackages = await vslPackageModel.find();
    const orders = await orderHistoryModel.find();
    const specialPackage = await specialPackageModel.find();

    return res.status(201).json({
      msg: "success",
      dta: {
        users: users.length,
        contacts: contacts.length,
        packages: packages.length,
        vslPackages: vslPackages.length,
        orders: orders.length,
        totaluser: totaluser.length,
        specialPackage: specialPackage.length,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

module.exports = routes;
