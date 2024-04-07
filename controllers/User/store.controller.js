const userModel = require("../../models/user.model");
const orderHistoryModel = require("../../models/orderHistory.model");
const storeModel = require("../../models/store.model");

const sendPayment = require("../../utils/MailService/sendPayment.utils");
const oneTimePayment = require("../../utils/Payment/Authorize/oneTimePayment.utils");
const RSA_Decryption = require("../../utils/CipherText/RSA_Decryption.utils");

const routes = {};

routes.allStores = async (req, res) => {
  const { page } = req.query;

  try {
    const store = await storeModel.find({
      isDeleted: false,
    });

    const limit = 10;
    const totalPages = Math.ceil(store.length / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = store.slice(startIndex, endIndex);

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

routes.storesById = async (req, res) => {
  const { id } = req.id;

  try {
    const store = await storeModel.findById(id);

    if (!store) {
      return res.status(404).json({ error: "store not found" });
    }

    return res.status(201).json({ msg: "success", dta: store });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.buyStore = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  try {
    const { storeId } = req.body;
    // console.log(req.body);
    const id = req.userId;

    const user = await userModel.findById(id);
    const store = await storeModel.findById(storeId);

    // console.log(store);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (!store) {
      return res.status(404).json({ error: "Item not found" });
    }

    const amount = store.price.toFixed(2);

    const paymentIntent = await stripe.paymentIntents.create({
      description: store.name,
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

routes.validPaymentStore = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const { paymentIntentId, storeId } = req.body;
  const { id } = req.query;

  try {
    const store = await storeModel.findById(storeId);
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    if (!store) {
      return res.status(404).json({ error: "Item not found" });
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // console.log(paymentIntent);

    if (paymentIntent.status === "succeeded") {
      const order = await orderHistoryModel.create({
        user: id,
        store: storeId,
        status: "active",
        desc: `Store - ${store.name} purchased`,
        price: store.price.toFixed(2),
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

      user.store.push(store._id);
      user.orderHistory.push(order._id);
      user.wallet += store.credits;

      await user.save();
      sendPayment(
        user.email,
        user.name,
        store.name,
        store.price.toFixed(2),
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

routes.buyStoreAuthorize = async (req, res) => {
  const { encryptedCardDetails, storeId } = req.body;
  const id = req.userId;

  try {
    const user = await userModel.findById(id);
    const store = await storeModel.findById(storeId);

    const [cardNumber, cardExpiryDate, cardCvc] =
      RSA_Decryption(encryptedCardDetails).split(",");

    const cardDetails = {
      number: cardNumber,
      expiryDate: cardExpiryDate,
      cvc: cardCvc,
    };

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (!store) {
      return res.status(404).json({ error: "Item not found" });
    }

    try {
      await oneTimePayment(cardDetails, store, store.price.toFixed(2), user);
    } catch (error) {
      return res.status(400).json({ error });
    }

    const order = await orderHistoryModel.create({
      user: id,
      store: storeId,
      status: "active",
      desc: `Store - ${store.name} purchased`,
      price: store.price.toFixed(2),
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

    user.store.push(store._id);
    user.orderHistory.push(order._id);
    user.wallet += store.credits;

    await user.save();
    sendPayment(
      user.email,
      user.name,
      store.name,
      store.price.toFixed(2),
      order.createdAt,
      "JordansPicks - Payment Confirmation",
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
