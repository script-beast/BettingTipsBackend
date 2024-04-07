// import corn from "node-cron";
// import ReccurringOrderModel from "../../models/RecurringOrder.model";
// import orderHistoryModel from "../../models/orderHistory.model";
// import userModel from "../../models/user.model";
// import specialPackageModel from "../../models/specialPackage.model";

const corn = require("node-cron");
const ReccurringOrderModel = require("../../models/RecurringOrder.model");
const orderHistoryModel = require("../../models/orderHistory.model");
// const userModel = require("../../models/user.model");
// const specialPackageModel = require("../../models/specialPackage.model");

const YearlyRecurringCheck = corn.schedule("0 1 * * *", async () => {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const recurringOrders = await ReccurringOrderModel.find({
      type: "yearly",
      status: "active",
    });

    for (let i = 0; i < recurringOrders.length; i++) {
      const recurringOrder = recurringOrders[i];

      const subscription = await stripe.subscriptions.retrieve(
        recurringOrder.stripeSubscriptionId,
      );
      if (subscription.status !== "active") {
        const orderHistoryId =
          recurringOrder.orderHistory[recurringOrder.orderHistory.length - 1];
        const orderHistory = await orderHistoryModel.findById(orderHistoryId);
        orderHistory.status = "inactive";
        await orderHistory.save();
        recurringOrder.status = "inactive";
        await recurringOrder.save();
      }
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = YearlyRecurringCheck;
