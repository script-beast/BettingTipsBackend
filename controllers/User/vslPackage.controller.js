const userModel = require("../../models/user.model");
const orderHistoryModel = require("../../models/orderHistory.model");
const vslPackageModel = require("../../models/vslPackage.model");

const sendPayment = require("../../utils/MailService/sendPayment.utils");

const userValid = require("../../validations/user.joi");

const routes = {};

routes.getVslPackage = async (req, res) => {
  try {
    const uid = req.userId;
    const id = req.params.id;
    const package = await vslPackageModel.findById(id);
    const user = await userModel.findById(uid).populate("vslPackage");

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (!package.pageCount) package.pageCount = 0;

    package.pageCount = package.pageCount + 1;

    await package.save();

    // console.log(user);

    const isBuied = user.vslPackage.find((item) => {
      // console.log(item._id);
      return item._id == id;
    });
    let isBought = false;
    if (isBuied) isBought = true;

    // console.log(isBuied);

    return res.status(200).json({ msg: "success", dta: package, isBought });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.buyVslPackage = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  try {
    const { packageId, amount } = req.body;
    const id = req.userId;

    const { error } = userValid.buyVslPackageValidation.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await userModel.findById(id);
    const package = await vslPackageModel.findById(packageId);

    // console.log(package);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (user.vslPackage.includes(packageId)) {
      return res.status(400).json({ error: "package already purchased" });
    }

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (package.endDate < Date.now()) {
      return res.status(400).json({ error: "package expired" });
    }

    if (amount <= 0)
      return res.status(400).json({ error: "amount must be greater than 0" });

    const paymentIntent = await stripe.paymentIntents.create({
      description: package.name,
      shipping: {
        name: user.name,
        address: {
          line1: "510 Townsend St",
          postal_code: "98140",
          city: "San Francisco",
          state: "CA",
          country: "US",
        },
      },
      amount: (amount * 100).toFixed(0),
      currency: "usd",
      payment_method_types: ["card"],
    });

    // console.log(paymentIntent);

    return res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.validPaymentVslPackage = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const { paymentIntentId, packageId, walletDeduction, cardDeduction } =
    req.body;

  const { error } = userValid.validPaymentVslPackageValidation.validate(
    req.body,
  );

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const id = req.userId;
  // console.log(req.body, id);
  // console.log(paymentIntentId);
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // console.log(paymentIntent);

    if (paymentIntent.status === "succeeded") {
      const package = await vslPackageModel.findById(packageId);
      const user = await userModel.findById(id);
      // console.log(package, user);

      if (!user) {
        return res.status(404).json({ error: "user not found" });
      }
      if (user.vslPackage.includes(packageId)) {
        return res.status(400).json({ error: "Package already purchased" });
      }
      if (!package) {
        return res.status(404).json({ error: "Package not found" });
      }

      const order = await orderHistoryModel.create({
        user: id,
        vslPackage: packageId,
        status: "active",
        desc: `Package - ${package.name} purchased (card)`,
        price: +cardDeduction,
      });

      if (walletDeduction > 0) {
        const walletOrder = await orderHistoryModel.create({
          user: id,
          vslPackage: packageId,
          status: "active",
          desc: `Package - ${package.name} purchased (wallet)`,
          price: walletDeduction,
        });
        user.orderHistory.push(walletOrder._id);
        user.wallet = user.wallet - walletDeduction;
      }

      user.vslPackage.push(package._id);
      user.orderHistory.push(order._id);

      await user.save();
      sendPayment(
        user.email,
        user.name,
        package.name,
        package.discountedPrice,
        order.createdAt,
        "JordansPicks - Payment Confirmation",
      );
    }

    return res.send({
      status: paymentIntent.status,
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ status: "Failed" });
  }
};

routes.walletWithdrawVslPackage = async (req, res) => {
  try {
    const id = req.userId;
    const { packageId } = req.body;

    const { error } = userValid.walletWithdrawVslPackageValidation.validate(
      req.body,
    );

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await userModel.findById(id);
    const package = await vslPackageModel.findById(packageId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (user.vslPackage.includes(packageId)) {
      return res.status(400).json({ error: "package already purchased" });
    }

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (user.wallet < package.price.toFixed(2)) {
      return res.status(400).json({ error: "insufficient balance" });
    }

    user.wallet = user.wallet - package.discountedPrice;

    const newOrder = await orderHistoryModel.create({
      user: id,
      vslPackage: packageId,
      status: "active",
      desc: `Package - ${package.name} purchased (wallet)`,
      price: package.discountedPrice,
    });

    user.orderHistory.push(newOrder._id);
    user.vslPackage.push(packageId);

    await user.save();

    sendPayment(
      user.email,
      user.name,
      package.name,
      package.discountedPrice,
      newOrder.createdAt,
      "JordansPicks - Payment Confirmation",
    );

    return res.status(200).json({ msg: "success", dta: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

module.exports = routes;
