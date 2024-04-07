const userModel = require("../../models/user.model");
const orderHistoryModel = require("../../models/orderHistory.model");
const packageModel = require("../../models/package.model");

const sendPayment = require("../../utils/MailService/sendPayment.utils");
const oneTimePayment = require("../../utils/Payment/Authorize/oneTimePayment.utils");
const RSA_Decryption = require("../../utils/CipherText/RSA_Decryption.utils");

const userValid = require("../../validations/user.joi");

const routes = {};

routes.allActivePackages = async (req, res) => {
  try {
    const packages = await packageModel
      .find({ status: "active" })
      .select("-bets");
    return res.status(201).json({ msg: "success", dta: packages });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.getPackage = async (req, res) => {
  try {
    const uid = req.userId;
    const id = req.params.id;
    console.log(id, uid);
    const package = await packageModel.findById(id);
    const user = await userModel.findById(uid).populate("package");

    console.log(user);

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (!package.pageCount) package.pageCount = 0;

    package.pageCount = package.pageCount + 1;

    await package.save();

    const isBuied = user.package.find((item) => {
      // console.log(item._id);
      return item._id == id;
    });
    let isBought = false;
    if (isBuied) isBought = true;
    else package.bets = [];

    // console.log(isBuied);

    return res.status(200).json({ msg: "success", dta: package, isBought });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.buyPackage = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  try {
    const { packageId, amount } = req.body;
    const id = req.userId;

    const { error } = userValid.buyPackageValidation.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const user = await userModel.findById(id);
    const package = await packageModel.findById(packageId);

    // console.log(package);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (user.package.includes(packageId)) {
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

    // const newamount = amount.toFixed(2);
    // console.log((amount * 100).toFixed(0));
    // const newamount =

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

routes.validPaymentPackage = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const { paymentIntentId, packageId, walletDeduction, cardDeduction } =
    req.body;
  const { id } = req.query;

  const { error } = userValid.validPaymentPackageValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // console.log(req.body, id);
  // console.log(paymentIntentId);
  try {
    const package = await packageModel.findById(packageId);
    const user = await userModel.findById(id);
    // console.log(package, user);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    if (user.package.includes(packageId)) {
      return res.status(400).json({ error: "Package already purchased" });
    }
    if (!package) {
      return res.status(404).json({ error: "Package not found" });
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      const order = await orderHistoryModel.create({
        user: id,
        package: packageId,
        status: "active",
        desc: `Package - ${package.name} purchased (card)`,
        price: parseInt(cardDeduction).toFixed(2),
        type: "Debit",
        method: "Card",
      });

      if (user.referredBy) {
        const refUser = await userModel.findById(user.referredBy);
        if (refUser) {
          const val = +(0.25 * +cardDeduction).toFixed(2);
          refUser.wallet += val;
          const refOrder = await orderHistoryModel.create({
            user: refUser._id,
            status: "active",
            desc: `Bonus from ${user.name} purchase`,
            price: val.toFixed(2),
            type: "Credit",
            method: "Wallet",
          });
          refUser.orderHistory.push(refOrder._id);
          await refUser.save();
        }
      }

      if (walletDeduction > 0) {
        const walletOrder = await orderHistoryModel.create({
          user: id,
          package: packageId,
          status: "active",
          desc: `Package - ${package.name} purchased (wallet)`,
          price: +walletDeduction.toFixed(2),
          type: "Debit",
          method: "Wallet",
        });
        user.orderHistory.push(walletOrder._id);
        user.wallet = user.wallet - walletDeduction;
      }

      user.package.push(package._id);
      user.orderHistory.push(order._id);

      await user.save();
      sendPayment(
        user.email,
        user.name,
        package.name,
        package.price.toFixed(2),
        order.createdAt,
        "JordansPicks - Payment Confirmation"
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

routes.walletWithdrawPackage = async (req, res) => {
  try {
    const id = req.userId;
    const { packageId, amount } = req.body;

    const { error } = userValid.walletWithdrawPackageValidation.validate(
      req.body
    );

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await userModel.findById(id);
    const package = await packageModel.findById(packageId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    if (user.package.includes(packageId)) {
      return res.status(400).json({ error: "package already purchased" });
    }

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (user.wallet < amount) {
      return res.status(400).json({ error: "insufficient balance" });
    }

    user.wallet = user.wallet - amount;

    const newOrder = await orderHistoryModel.create({
      user: id,
      package: packageId,
      status: "active",
      desc: `Package - ${package.name} purchased (wallet)`,
      price: amount.toFixed(2),
      type: "Debit",
      method: "Wallet",
    });

    user.orderHistory.push(newOrder._id);
    user.package.push(packageId);

    await user.save();

    sendPayment(
      user.email,
      user.name,
      package.name,
      amount.toFixed(2),
      newOrder.createdAt,
      "JordansPicks - Payment Confirmation"
    );

    return res.status(200).json({ msg: "success", dta: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.buyPackageAuthorize = async (req, res) => {
  try {
    const { encryptedCardDetails, packageId, walletDeduction, cardDeduction } =
      req.body;
    const id = req.userId;

    const user = await userModel.findById(id);
    const package = await packageModel.findById(packageId);

    const [cardNumber, cardExpiryDate, cardCvc] =
      RSA_Decryption(encryptedCardDetails).split(",");

    const cardDetails = {
      number: cardNumber,
      expiryDate: cardExpiryDate,
      cvc: cardCvc,
    };

    // console.log(package);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (user.package.includes(packageId)) {
      return res.status(400).json({ error: "package already purchased" });
    }

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (package.endDate < Date.now()) {
      return res.status(400).json({ error: "package expired" });
    }

    if (cardDeduction <= 0)
      return res.status(400).json({ error: "amount must be greater than 0" });

    console.log(walletDeduction, user.wallet);
    if (walletDeduction > 0 && user.wallet < walletDeduction) {
      return res.status(400).json({ error: "insufficient balance" });
    }

    try {
      await oneTimePayment(cardDetails, package, cardDeduction, user);
    } catch (error) {
      return res.status(400).json({ error });
    }

    const order = await orderHistoryModel.create({
      user: id,
      package: packageId,
      status: "active",
      desc: `Package - ${package.name} purchased (card)`,
      price: parseFloat(cardDeduction).toFixed(2),
      type: "Debit",
      method: "Card",
    });

    if (user.referredBy) {
      const refUser = await userModel.findById(user.referredBy);
      if (refUser) {
        const val = +(0.25 * +cardDeduction).toFixed(2);
        refUser.wallet += val;
        const refOrder = await orderHistoryModel.create({
          user: refUser._id,
          status: "active",
          desc: `Bonus from ${user.name} purchase`,
          price: val.toFixed(2),
          type: "Credit",
          method: "Wallet",
        });
        refUser.orderHistory.push(refOrder._id);
        await refUser.save();
      }
    }

    if (walletDeduction > 0) {
      const walletOrder = await orderHistoryModel.create({
        user: id,
        package: packageId,
        status: "active",
        desc: `Package - ${package.name} purchased (wallet)`,
        price: parseFloat(walletDeduction).toFixed(2),
        type: "Debit",
        method: "Wallet",
      });
      user.orderHistory.push(walletOrder._id);
      user.wallet = user.wallet - walletDeduction;
    }

    user.package.push(package._id);
    user.orderHistory.push(order._id);

    await user.save();
    sendPayment(
      user.email,
      user.name,
      package.name,
      package.price.toFixed(2),
      order.createdAt,
      "JordansPicks - Payment Confirmation"
    );

    return res.send({
      msg: "success",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

module.exports = routes;
