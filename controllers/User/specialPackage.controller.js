const userModel = require("../../models/user.model");
const orderHistoryModel = require("../../models/orderHistory.model");
const specialPackageModel = require("../../models/specialPackage.model");
const reccuringOrderModel = require("../../models/RecurringOrder.model");

const sendPayment = require("../../utils/MailService/sendPayment.utils");
const recurringMonthly = require("../../utils/Payment/Authorize/recurringMonthly.utils");
const cancelRecurringOrder = require("../../utils/Payment/Authorize/cancelRecurring.utils");
const RSA_Decryption = require("../../utils/CipherText/RSA_Decryption.utils");

const routes = {};

routes.allSpecialPackages = async (req, res) => {
  try {
    const packages = await specialPackageModel
      .find({ isDeleted: false })
      .select("-links");

    return res.status(201).json({ msg: "success", dta: packages });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.getSpecialPackage = async (req, res) => {
  try {
    const uid = req.userId;
    const id = req.params.id;
    const package = await specialPackageModel.findById(id);
    const isBuied = await reccuringOrderModel.findOne({
      userId: uid,
      specialPackage: id,
      status: "active",
    });

    console.log(isBuied);

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (!package.pageCount) package.pageCount = 0;

    package.pageCount = package.pageCount + 1;

    await package.save();

    // const isBuied = user.specialPackage.find((item) => {
    //   // console.log(item._id);
    //   return item._id == id;
    // });

    let isBought = false;

    if (isBuied) isBought = true;
    else package.links = [];

    // console.log(isBuied);

    return res.status(200).json({ msg: "success", dta: package, isBought });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.buySpecialPackage = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const { packageId } = req.body;
  const id = req.userId;
  try {
    // const { error } = userValid.buySpecialPackageValidation.validate(req.body);

    // if (error) {
    //   return res.status(400).json({ error: error.details[0].message });
    // }

    const user = await userModel.findById(id);
    const package = await specialPackageModel.findById(packageId);

    // console.log(package);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (user.specialPackage.includes(packageId)) {
      return res.status(400).json({ error: "package already purchased" });
    }

    const amount = package.price.toFixed(2);

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

routes.validPaymentSpecialPackage = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const { paymentIntentId, packageId } = req.body;
  const { id } = req.query;

  // const { error } = userValid.validPaymentSpecialPackageValidation.validate(
  //   req.body
  // );

  // if (error) {
  //   return res.status(400).json({ error: error.details[0].message });
  // }

  // console.log(req.body, id);
  // console.log(paymentIntentId);
  try {
    const package = await specialPackageModel.findById(packageId);
    const user = await userModel.findById(id);
    // console.log(package, user);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    if (user.specialPackage.includes(packageId)) {
      return res.status(400).json({ error: "Package already purchased" });
    }
    if (!package) {
      return res.status(404).json({ error: "Package not found" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // console.log(paymentIntent);

    const cardDeduction = package.price.toFixed(2);

    if (paymentIntent.status === "succeeded") {
      const order = await orderHistoryModel.create({
        user: id,
        specialPackage: packageId,
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
            desc: `Referral Bonus`,
            price: val.toFixed(2),
            type: "Credit",
            method: "Wallet",
          });
          refUser.orderHistory.push(refOrder._id);
          await refUser.save();
        }
      }

      user.specialPackage.push(package._id);
      user.orderHistory.push(order._id);

      await user.save();
      sendPayment(
        user.email,
        user.name,
        package.name,
        package.price.toFixed(2),
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

routes.createReccuringOrderMonthly = async (req, res) => {
  const { specialPackageId, paymentMethod } = req.body;
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const userId = req.userId;

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const package = await specialPackageModel.findById(specialPackageId);

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (!paymentMethod) {
      return res.status(404).json({ error: "payment method not found" });
    }

    const exiting = reccuringOrderModel.findOne({
      userId: userId,
      specialPackage: specialPackageId,
    });

    if (exiting && exiting.status === "active") {
      return res.status(400).json({ error: "order already exists" });
    }
    let customer;
    console.log(paymentMethod);

    // if (!user.stripeCustomerId) {
    customer = await stripe.customers.create({
      name: user.name,
      email: user.email,
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
      payment_method: paymentMethod,
      invoice_settings: {
        default_payment_method: paymentMethod,
      },
    });

    user.stripeCustomerId = customer.id;
    await user.save();
    // } else {
    //   customer = await stripe.customers.retrieve(user.stripeCustomerId);
    // }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      currency: "usd",
      items: [{ price: package.stripeMonthlyPriceId }],
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
    });

    await reccuringOrderModel.create({
      userId: userId,
      specialPackage: specialPackageId,
      price: package.monthlyPrice,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      validTill: new Date(subscription.current_period_end * 1000),
      type: "monthly",
      paymentIntentId: subscription.latest_invoice.payment_intent.id,
    });

    console.log(subscription);

    return res.status(201).json({
      msg: "success",
      dta: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.validPaymentReccuringOrderMonthly = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const { paymentIntentId } = req.body;
  const { id } = req.query;

  try {
    const user = await userModel.findById(id);
    const reccuringOrder = await reccuringOrderModel.findOne({
      userId: id,
      paymentIntentId: paymentIntentId,
    });

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (!reccuringOrder) {
      return res.status(404).json({ error: "order not found" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // const order = await orderHistoryModel.create({
      //   user: id,
      //   specialPackage: reccuringOrder.specialPackageId,
      //   status: "active",
      //   desc: `Package - ${reccuringOrder.specialPackageId} purchased (card)`,
      //   price: reccuringOrder.price,
      //   type: "Debit",
      //   method: "Card",
      // });

      user.reccuringOrder.push(reccuringOrder._id);
      // user.orderHistory.push(order._id);
      if (!user.specialPackage.includes(reccuringOrder.specialPackage))
        user.specialPackage.push(reccuringOrder.specialPackage);

      // reccuringOrder.orderHistory.push(order._id);
      reccuringOrder.status = "active";

      await reccuringOrder.save();
      await user.save();
    }

    return res.send({
      status: paymentIntent.status,
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ status: "Failed" });
  }
};

routes.createReccuringOrderYearly = async (req, res) => {
  const { specialPackageId, paymentMethod } = req.body;
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const userId = req.userId;

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const package = await specialPackageModel.findById(specialPackageId);

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    if (!paymentMethod) {
      return res.status(404).json({ error: "payment method not found" });
    }

    const exiting = reccuringOrderModel.findOne({
      userId: userId,
      specialPackage: specialPackageId,
    });

    if (exiting && exiting.status === "active") {
      return res.status(400).json({ error: "order already exists" });
    }
    let customer;
    console.log(paymentMethod);

    // if (!user.stripeCustomerId) {
    customer = await stripe.customers.create({
      name: user.name,
      email: user.email,
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
      payment_method: paymentMethod,
      invoice_settings: {
        default_payment_method: paymentMethod,
      },
    });

    user.stripeCustomerId = customer.id;
    await user.save();
    // } else {
    //   customer = await stripe.customers.retrieve(user.stripeCustomerId);
    // }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      currency: "usd",
      items: [{ price: package.stripeYearlyPriceId }],
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
    });

    await reccuringOrderModel.create({
      userId: userId,
      specialPackage: specialPackageId,
      price: package.yearlyPrice,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      validTill: new Date(subscription.current_period_end * 1000),
      type: "yearly",
      paymentIntentId: subscription.latest_invoice.payment_intent.id,
    });

    console.log(subscription);

    return res.status(201).json({
      msg: "success",
      dta: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.validPaymentReccuringOrderYearly = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const { paymentIntentId } = req.body;
  const { id } = req.query;

  try {
    const user = await userModel.findById(id);
    const reccuringOrder = await reccuringOrderModel.findOne({
      userId: id,
      paymentIntentId: paymentIntentId,
    });

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (!reccuringOrder) {
      return res.status(404).json({ error: "order not found" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // const order = await orderHistoryModel.create({
      //   user: id,
      //   specialPackage: reccuringOrder.specialPackageId,
      //   status: "active",
      //   desc: `Package - ${reccuringOrder.specialPackageId} purchased (card)`,
      //   price: reccuringOrder.price,
      //   type: "Debit",
      //   method: "Card",
      // });

      user.reccuringOrder.push(reccuringOrder._id);
      // user.orderHistory.push(order._id);
      if (!user.specialPackage.includes(reccuringOrder.specialPackage))
        user.specialPackage.push(reccuringOrder.specialPackage);

      // reccuringOrder.orderHistory.push(order._id);
      reccuringOrder.status = "active";

      await reccuringOrder.save();
      await user.save();
    }

    return res.send({
      status: paymentIntent.status,
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ status: "Failed" });
  }
};

routes.cancelRecurringOrder = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    const user = await userModel.findById(userId);
    const order = await reccuringOrderModel.findOne({
      _id: id,
      userId: userId,
    });

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (!order) {
      return res.status(404).json({ error: "order not found" });
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    await stripe.subscriptions.cancel(order.stripeSubscriptionId);

    order.status = "inactive";
    await order.save();

    return res.status(200).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.createReccuringOrderMonthlyAuthorize = async (req, res) => {
  const { specialPackageId, encryptedCardDetails } = req.body;
  const userId = req.userId;

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const package = await specialPackageModel.findById(specialPackageId);

    const [cardNumber, cardExpiryDate, cardCvc] =
      RSA_Decryption(encryptedCardDetails).split(",");

    const cardDetails = {
      number: cardNumber,
      expiryDate: cardExpiryDate,
      cvc: cardCvc,
    };
    console.log(package);
    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    const existing = await reccuringOrderModel.findOne({
      userId: userId,
      specialPackage: specialPackageId,
    });

    if (existing && existing.status === "active") {
      return res.status(400).json({ error: "order already exists" });
    }

    let response;
    try {
      response = await recurringMonthly(cardDetails, package, user);
    } catch (error) {
      return res.status(400).json({ error });
    }

    const order = await reccuringOrderModel.create({
      userId: userId,
      specialPackage: specialPackageId,
      price: package.monthlyPrice,
      authorizeId: response,
      validTill: new Date().setMonth(new Date().getMonth() + 1),
      type: "monthly",
      status: "active",
    });

    user.reccuringOrder.push(order._id);
    if (!user.specialPackage.includes(specialPackageId))
      user.specialPackage.push(specialPackageId);

    await user.save();

    return res.status(201).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.createReccuringOrderYearlyAuthorize = async (req, res) => {
  const { specialPackageId, encryptedCardDetails } = req.body;
  const userId = req.userId;

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const package = await specialPackageModel.findById(specialPackageId);

    const [cardNumber, cardExpiryDate, cardCvc] =
      RSA_Decryption(encryptedCardDetails).split(",");

    const cardDetails = {
      number: cardNumber,
      expiryDate: cardExpiryDate,
      cvc: cardCvc,
    };

    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    const existing = await reccuringOrderModel.findOne({
      userId: userId,
      specialPackage: specialPackageId,
    });

    if (existing && existing.status === "active") {
      return res.status(400).json({ error: "order already exists" });
    }

    let response;
    try {
      response = await recurringMonthly(cardDetails, package, user);
    } catch (error) {
      return res.status(400).json({ error });
    }

    const order = await reccuringOrderModel.create({
      userId: userId,
      specialPackage: specialPackageId,
      price: package.yearlyPrice,
      authorizeId: response,
      validTill: new Date().setMonth(new Date().getMonth() + 12),
      type: "yearly",
      status: "active",
    });

    user.reccuringOrder.push(order._id);
    if (!user.specialPackage.includes(specialPackageId))
      user.specialPackage.push(specialPackageId);

    await user.save();

    return res.status(201).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.cancelRecurringOrderAuthorize = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    const user = await userModel.findById(userId);
    const order = await reccuringOrderModel.findOne({
      _id: id,
      userId: userId,
    });

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (!order) {
      return res.status(404).json({ error: "order not found" });
    }

    let response;
    try {
      response = await cancelRecurringOrder(order.authorizeId);
    } catch (error) {
      return res.status(400).json({ error });
    }

    order.status = "inactive";
    await order.save();

    return res.status(200).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

module.exports = routes;
