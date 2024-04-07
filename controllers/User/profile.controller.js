const userModel = require("../../models/user.model");
const orderHistoryModel = require("../../models/orderHistory.model");
const recurringOrderModel = require("../../models/RecurringOrder.model");

const bcrypt = require("bcryptjs");
const userValid = require("../../validations/user.joi");

const routes = {};

routes.updateProfile = async (req, res) => {
  const id = req.userId;

  const { name, mobile, currentPassword, newPassword } = req.body;

  const { error } = userValid.updateProfileValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const user = await userModel.findById(id);

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }
  user.name = name;
  user.mobile = mobile;

  if (currentPassword && newPassword) {
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
  }

  await user.save();

  return res.status(200).json({ msg: "success", dta: user });
};

routes.updateAddress = async (req, res) => {
  const id = req.userId;

  const { address, city, state, zip, country, company } = req.body;

  const { error } = userValid.updateAddressValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const user = await userModel.findById(id);

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  user.address = address;
  user.city = city;
  user.state = state;
  user.zip = zip;
  user.country = country;
  if (company) user.company = company;

  await user.save();

  return res.status(200).json({ msg: "success", dta: user });
};

routes.userDashboard = async (req, res) => {
  try {
    const id = req.userId;

    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({
      msg: "success",
      dta: { user },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.getProfileShort = async (req, res) => {
  try {
    const id = req.userId;
    const user = await userModel.findById(id).populate("specialPackage");

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const activeSpecialPackage = await recurringOrderModel
      .find({
        userId: id,
        status: "active",
      })
      .populate("specialPackage");

    const act = activeSpecialPackage.filter(
      (ele) => !ele.specialPackage.isDeleted
    );
    let maxdis = 0;

    // console.log(act);

    act.forEach((ele) => {
      if (ele.specialPackage.discount > maxdis)
        maxdis = ele.specialPackage.discount;
    });

    let isAddress = false;
    if (user.address && user.city && user.state && user.zip && user.country) {
      isAddress = true;
    }

    return res.status(200).json({
      msg: "success",
      dta: {
        _id: user._id,
        wallet: user.wallet,
        name: user.name,
        isVerified: user.isVerified,
        defaultDiscount: maxdis,
        cart: user.cart,
        isAddress,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.getMyPackages = async (req, res) => {
  const { page = 1 } = req.query;

  try {
    const id = req.userId;

    const package = await userModel
      .findById(id)
      .populate("package specialPackage");
    const packag = package.package;
    const specialPackages = package.specialPackage;

    // console.log(specialPackages);
    //append special packages
    // package.specialPackage.forEach((item) => {
    //   packages.push(item);
    // });
    // without for each
    // packages.push(...specialPackages);
    const packages = [...packag, ...specialPackages];
    //revese the array
    packages.reverse();
    // console.log(packages);
    const limit = 10;
    const totalPages = Math.ceil(packages.length / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = packages.slice(startIndex, endIndex);

    return res.status(201).json({
      msg: "success",
      totalPages,
      dta: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.getTransactions = async (req, res) => {
  const { page = 1 } = req.query;

  try {
    const id = req.userId;

    const totalOrders = await orderHistoryModel.countDocuments({ user: id });

    const orderHistory = await orderHistoryModel
      .find({ user: id })
      .populate("package")
      .populate("vslPackage")
      .populate("specialPackage")
      .populate("store")
      .sort({ createdAt: -1 })
      .skip((page - 1) * 10)
      .limit(10);

    const totalPages = Math.ceil(totalOrders / 10);

    return res.status(200).json({
      msg: "success",
      totalPages,
      dta: orderHistory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.getRecurringTransactions = async (req, res) => {
  const { page = 1 } = req.query;

  try {
    const id = req.userId;

    const totalOrders = await recurringOrderModel.countDocuments({
      userId: id,
    });

    const recurringHistory = await recurringOrderModel
      .find({ userId: id })
      .populate("specialPackage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * 10)
      .limit(10);

    const totalPages = Math.ceil(totalOrders / 10);

    return res.status(200).json({
      msg: "success",
      totalPages,
      dta: recurringHistory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.getReferredUsers = async (req, res) => {
  const id = req.userId;

  try {
    const user = await userModel.findById(id);
    const listref = await userModel
      .find({ referredBy: user._id })
      .select("name createdAt email");

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res
      .status(200)
      .json({ msg: "success", dta: listref, referralCode: user.referralCode });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

module.exports = routes;
