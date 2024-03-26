const orderHistoryModel = require("../../models/orderHistory.model");
const vslPackageModel = require("../../models/vslPackage.model");
const userModel = require("../../models/user.model");

const adminValid = require("../../validations/admin.joi");

const routes = {};

routes.allVslPackages = async (req, res) => {
  const { page } = req.query;

  try {
    const packages = await vslPackageModel.find();

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

routes.vslPackageById = async (req, res) => {
  const { id } = req.params;

  try {
    const package = await vslPackageModel.findOne({ _id: id });

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    return res.status(201).json({ msg: "success", dta: package });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.addVslPackage = async (req, res) => {
  const {
    name,
    actPrice,
    discountedPrice,
    bets,
    description,
    gamePreview,
    startDate,
    endDate,
    saleTitle,
    videoURL,
  } = req.body;

  const { error } = adminValid.addVslPackageValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const newPackage = await vslPackageModel.create({
      name,
      actPrice: actPrice.toFixed(2) || 0,
      discountedPrice: discountedPrice.toFixed(2) || 0,
      description,
      gamePreview,
      startDate,
      endDate,
      saleTitle,
      bets,
      videoURL,
    });

    // bets.forEach(async (bet) => {
    //   const newBet = await betModel.create({
    //     title: bet,
    //   });

    //   await vslPackageModel.findOneAndUpdate(
    //     { _id: newPackage._id },
    //     { $push: { bets: newBet._id } },
    //     { new: true }
    //   );
    // });

    return res.status(201).json({ msg: "success", dta: newPackage });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.updateVslPackageStatus = async (req, res) => {
  const { id } = req.params;
  let { status, result } = req.body;

  const { error } = adminValid.updateVslPackageStatusValidation.validate(
    req.body
  );

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const package = await vslPackageModel.findOne({ _id: id });

  if (!package) {
    return res.status(404).json({ error: "package not found" });
  }

  if (!status) {
    status = package.status;
  }

  if (!result) {
    result = package.result;
  }

  if (result === "lose") {
    //credit price to all users wallet who bought
    const orders = await orderHistoryModel
      .find({ vslPackage: id })
      .populate("user")
      .populate("vslPackage");

    const user = new Set([]);

    orders.forEach(async (order) => {
      user.add(order.user._id);
    });

    const uniqueuser = Array.from(user);

    uniqueuser.forEach(async (userId) => {
      await userModel.findOneAndUpdate(
        { _id: userId },
        { $inc: { wallet: orders[0].vslPackage.discountedPrice.toFixed(2) } },
        { new: true }
      );

      const newOrder = await orderHistoryModel.create({
        user: userId,
        vslPackage: id,
        status: "inactive",
        desc: "Refund of " + orders[0].vslPackage.name + " package",
        price: orders[0].vslPackage.discountedPrice.toFixed(2),
      });

      await userModel.findOneAndUpdate(
        { _id: userId },
        { $push: { orderHistory: newOrder._id } },
        { new: true }
      );
    });
  }

  if (result !== "pending") status = "inactive";

  const updatedPackage = await vslPackageModel.findOneAndUpdate(
    { _id: id },
    { status, result },
    { new: true }
  );

  return res.status(201).json({ msg: "success", dta: updatedPackage });
};

routes.getVslPackagePageCount = async (req, res) => {
  const { id } = req.params;

  try {
    const package = await vslPackageModel.findOne({ _id: id });

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    return res.status(201).json({ msg: "success", dta: package.pageCount });
  } catch (error) {
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.updateVslPackage = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    actPrice,
    discountedPrice,
    bets,
    description,
    gamePreview,
    startDate,
    endDate,
    saleTitle,
    videoURL,
  } = req.body;

  const { error } = adminValid.updateVslPackageValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const package = await vslPackageModel.findOne({ _id: id });

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    const updatedPackage = await vslPackageModel.findOneAndUpdate(
      { _id: id },
      {
        name,
        actPrice,
        discountedPrice,
        bets,
        description,
        gamePreview,
        startDate,
        endDate,
        saleTitle,
        videoURL,
      },
      { new: true }
    );

    return res.status(201).json({ msg: "success", dta: updatedPackage });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.deleteVslPackage = async (req, res) => {
  const { id } = req.params;

  try {
    const package = await vslPackageModel.findOne({ _id: id });

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (package.status === "active") {
      return res.status(404).json({ error: "package is active" });
    }

    if (package.result !== "pending") {
      return res.status(404).json({ error: "package is pending" });
    }

    await vslPackageModel.findOneAndUpdate(
      { _id: id },
      { isDeleted: true, status: "inactive" },
      { new: true }
    );

    return res.status(201).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.deletedVslPackages = async (req, res) => {
  const { page } = req.query;

  try {
    const packages = await vslPackageModel.find({ isDeleted: true });

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

module.exports = routes;
