const specialPackageModel = require("../../models/specialPackage.model");
const recurringOrderModel = require("../../models/RecurringOrder.model");

const routes = {};

routes.allSpecialPackages = async (req, res) => {
  const { page } = req.query;

  try {
    const packages = await specialPackageModel.find({ isDeleted: false });

    const limit = 10;
    const totalPages = Math.ceil(packages.length / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = packages.slice(startIndex, endIndex);

    return res.status(200).json({
      msg: "success",
      totalPages,
      dta: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.specialPackageById = async (req, res) => {
  const { id } = req.params;

  try {
    const package = await specialPackageModel.findOne({ _id: id });

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    return res.status(201).json({ msg: "success", dta: package });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.addSpecialPackage = async (req, res) => {
  const {
    name,
    monthlyPrice,
    yearlyPrice,
    price,
    links,
    description,
    gamePreview,
    discount,
    videoURL,
  } = req.body;

  // console.log(process.env.STRIPE_SECRET_KEY);
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  try {
    const newPackage = await specialPackageModel.create({
      name,
      monthlyPrice: parseFloat(monthlyPrice).toFixed(2) || 0,
      yearlyPrice: parseFloat(yearlyPrice).toFixed(2) || 0,
      description,
      gamePreview,
      price,
      links,
      discount,
      videoURL,
    });

    // convert to object

    //get the id of the package as string

    const packageId = newPackage.toObject()._id.toString();

    const product = await stripe.products.create({
      name: newPackage.name,
      metadata: {
        packageId: packageId,
      },

      active: true,
    });

    const monthlyPriceStripe = await stripe.prices.create({
      product: product.id,
      unit_amount: newPackage.monthlyPrice * 100,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: {
        packageId: packageId,
      },
    });

    const yearlyPriceStripe = await stripe.prices.create({
      product: product.id,
      unit_amount: newPackage.yearlyPrice * 100,
      currency: "usd",
      recurring: { interval: "year" },
      metadata: {
        packageId: packageId,
      },
    });

    newPackage.stripeProductId = product.id;
    newPackage.stripeMonthlyPriceId = monthlyPriceStripe.id;
    newPackage.stripeYearlyPriceId = yearlyPriceStripe.id;
    await newPackage.save();

    return res.status(201).json({ msg: "success", dta: newPackage });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.updateSpecialPackage = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    monthlyPrice,
    yearlyPrice,
    price,
    links,
    description,
    gamePreview,
    discount,
    videoURL,
  } = req.body;

  try {
    const package = await specialPackageModel.findById(id);
    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (package.isDeleted) {
      return res.status(404).json({ error: "package not found" });
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    if (package.monthlyPrice != monthlyPrice) {
      const newMonthlyPrice = await stripe.prices.create({
        product: package.stripeProductId,
        unit_amount: monthlyPrice * 100,
        currency: "usd",
        recurring: { interval: "month" },
      });

      await stripe.prices.update(package.stripeMonthlyPriceId, {
        active: false,
      });

      package.stripeMonthlyPriceId = newMonthlyPrice.id;
    }

    if (package.yearlyPrice != yearlyPrice) {
      const newYearlyPrice = await stripe.prices.create({
        product: package.stripeProductId,
        unit_amount: yearlyPrice * 100,
        currency: "usd",
        recurring: { interval: "year" },
      });

      await stripe.prices.update(package.stripeYearlyPriceId, {
        active: false,
      });

      package.stripeYearlyPriceId = newYearlyPrice.id;
    }

    if (package.name != name) {
      await stripe.products.update(package.stripeProductId, {
        name,
      });
    }

    const updatedPackage = await specialPackageModel.findOneAndUpdate(
      { _id: id },
      {
        name,
        monthlyPrice: parseFloat(monthlyPrice).toFixed(2) || 0,
        yearlyPrice: parseFloat(yearlyPrice).toFixed(2) || 0,
        description,
        gamePreview,
        price,
        links,
        videoURL,
        discount,
      },
      { new: true },
    );

    return res.status(201).json({ msg: "success", dta: updatedPackage });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.deleteSpecialPackage = async (req, res) => {
  const { id } = req.params;

  try {
    const package = await specialPackageModel.findOne({ _id: id });

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    const recurringOrders = await recurringOrderModel.find({
      specialPackage: id,
    });

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    recurringOrders.forEach(async (order) => {
      await stripe.subscriptions.cancel(order.stripeSubscriptionId);

      order.status = "inactive";
      await order.save();
    });

    await specialPackageModel.findOneAndUpdate(
      { _id: id },
      { isDeleted: true },
      { new: true },
    );

    return res.status(201).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.deletedSpecialPackage = async (req, res) => {
  const { page = 1 } = req.query;

  try {
    const packages = await specialPackageModel.find({ isDeleted: true });

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
