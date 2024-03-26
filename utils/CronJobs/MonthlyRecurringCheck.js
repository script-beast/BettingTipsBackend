const corn = require("node-cron");
const ReccurringOrderModel = require("../../models/RecurringOrder.model");
const orderHistoryModel = require("../../models/orderHistory.model");
// const userModel = require("../../models/user.model");
// const specialPackageModel = require("../../models/specialPackage.model");

const MonthlyRecurringCheck = corn.schedule("0 1 * * *", async () => {
  console.log("Monthly Recurring Check");
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const recurringOrders = await ReccurringOrderModel.find({
      type: "monthly",
      status: "active",
    });

    for (let i = 0; i < recurringOrders.length; i++) {
      const recurringOrder = recurringOrders[i];

      const subscription = await stripe.subscriptions.retrieve(
        recurringOrder.stripeSubscriptionId
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

module.exports = MonthlyRecurringCheck;
