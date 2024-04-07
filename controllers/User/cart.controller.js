const userModel = require("../../models/user.model");
const orderHistoryModel = require("../../models/orderHistory.model");

const sendPayment = require("../../utils/MailService/sendPayment.utils");
const oneTimePayment = require("../../utils/Payment/Authorize/oneTimePayment.utils");
const RSA_Decryption = require("../../utils/CipherText/RSA_Decryption.utils");

const routes = {};

routes.addItemToCart = async (req, res) => {
  const id = req.userId;
  const { packageId } = req.body;

  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (user.package.includes(packageId)) {
      return res.status(400).json({ error: "Item already purchased" });
    }

    if (user.cart.includes(packageId)) {
      return res.status(400).json({ error: "Item already in cart" });
    }

    user.cart.push(packageId);
    await user.save();

    return res.status(200).json({ msg: "Item added to cart" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.removeItemFromCart = async (req, res) => {
  const id = req.userId;
  const { packageId } = req.body;

  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (!user.cart.includes(packageId)) {
      return res.status(400).json({ error: "Item not in cart" });
    }

    user.cart = user.cart.filter((item) => item != packageId);

    await user.save();

    return res.status(200).json({ msg: "Item removed from cart" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.getCart = async (req, res) => {
  const id = req.userId;

  try {
    // const user = await userModel.findById(id).populate({
    //   path: "cart",
    //   select: "-bets",
    // });
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    user.cart = user.cart.filter((item) => !user.package.includes(item));

    await user.save();

    const result = await userModel.findById(id).populate("cart", "-bets");

    return res.status(200).json({ msg: "success", dta: result.cart });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.clearCart = async (req, res) => {
  const id = req.userId;

  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    user.cart = [];
    await user.save();

    return res.status(200).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.createIntentCart = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const { amount } = req.body;
  const id = req.userId;

  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (!user.cart.length) {
      return res.status(400).json({ error: "cart is empty" });
    }

    // any purchased item in cart
    const purchased = user.cart.find((item) => user.package.includes(item));

    if (purchased) {
      return res.status(400).json({ error: "Item already purchased" });
    }

    if (amount <= 0)
      return res.status(400).json({ error: "amount must be greater than 0" });

    const paymentIntent = await stripe.paymentIntents.create({
      description: "Cart",
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

    return res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.validPaymentCart = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const { paymentIntentId, walletDeduction, cardDeduction } = req.body;
  const { id } = req.query;

  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const purchased = user.cart.find((item) => {
      return user.package.includes(item);
    });

    if (purchased) {
      return res.status(400).json({ error: "Item already purchased" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      const order = await orderHistoryModel.create({
        user: id,
        status: "active",
        desc: `Cart purchased (card)`,
        price: +cardDeduction.toFixed(2),
        type: "Debit",
        method: "Card",
        cart: [...user.cart],
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

      if (walletDeduction > 0) {
        const walletOrder = await orderHistoryModel.create({
          user: id,
          status: "active",
          desc: `Cart purchased (wallet)`,
          price: walletDeduction.toFixed(2),
          type: "Debit",
          method: "Wallet",
          cart: [...user.cart],
        });
        user.orderHistory.push(walletOrder._id);
        user.wallet = user.wallet - walletDeduction;
      }

      user.orderHistory.push(order._id);
      user.package.push(...user.cart);
      user.cart = [];

      await user.save();
      sendPayment(
        user.email,
        user.name,
        "Cart",
        cardDeduction,
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

routes.walletWithdrawCart = async (req, res) => {
  const id = req.userId;
  const { amount } = req.body;

  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const purchased = user.cart.find((item) => {
      return user.package.includes(item);
    });

    if (purchased) {
      return res.status(400).json({ error: "Item already purchased" });
    }

    user.wallet -= amount;

    const order = await orderHistoryModel.create({
      user: id,
      status: "active",
      desc: `Cart purchased (wallet)`,
      price: amount.toFixed(2),
      type: "Debit",
      method: "Wallet",
      cart: [...user.cart],
    });

    user.orderHistory.push(order._id);

    user.package.push(...user.cart);
    user.cart = [];

    await user.save();

    sendPayment(
      user.email,
      user.name,
      "Cart",
      amount,
      order.createdAt,
      "JordansPicks - Payment Confirmation",
    );

    return res.status(200).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.paymentCartAuthorize = async (req, res) => {
  const { encryptedCardDetails, walletDeduction, cardDeduction } = req.body;
  const id = req.userId;

  try {
    const user = await userModel.findById(id).populate("cart");

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

    const purchased = user.cart.find((item) => {
      return user.package.includes(item);
    });

    if (user.cart.length === 0) {
      return res.status(400).json({ error: "cart is empty" });
    }

    if (purchased) {
      return res.status(400).json({ error: "Item already purchased" });
    }

    if (cardDeduction <= 0)
      return res.status(400).json({ error: "amount must be greater than 0" });

    if (walletDeduction > 0 && user.wallet < walletDeduction) {
      return res.status(400).json({ error: "insufficient balance" });
    }

    try {
      await oneTimePayment(cardDetails, user.cart[0], cardDeduction, user);
    } catch (error) {
      return res.status(400).json({ error });
    }

    const order = await orderHistoryModel.create({
      user: id,
      status: "active",
      desc: `Cart purchased (card)`,
      price: parseFloat(cardDeduction).toFixed(2),
      type: "Debit",
      method: "Card",
      cart: [...user.cart],
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
    if (walletDeduction > 0) {
      const walletOrder = await orderHistoryModel.create({
        user: id,
        status: "active",
        desc: `Cart purchased (wallet)`,
        price: walletDeduction.toFixed(2),
        type: "Debit",
        method: "Wallet",
        cart: [...user.cart],
      });
      user.orderHistory.push(walletOrder._id);
      user.wallet = user.wallet - walletDeduction;
    }

    user.orderHistory.push(order._id);
    user.package.push(...user.cart);
    user.cart = [];

    await user.save();
    sendPayment(
      user.email,
      user.name,
      "Cart",
      cardDeduction,
      order.createdAt,
      "JordansPicks - Payment Confirmation",
    );
    return res.send({
      msg: "success",
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ status: "Failed" });
  }
};

module.exports = routes;
