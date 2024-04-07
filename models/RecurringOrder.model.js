const mongoose = require("mongoose");

const reccuringOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  specialPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "specialPackage",
    default: null,
    required: true,
  },
  orderHistory: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "OrderHistory",
  },
  price: {
    type: Number,
    required: true,
  },
  stripeCustomerId: {
    type: String,
    // required: true,
  },
  stripeSubscriptionId: {
    type: String,
    // required: true,
  },
  validTill: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ["monthly", "yearly"],
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive",
  },
  paymentIntentId: {
    type: String,
  },
  authorizeId: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: function () {
      return Date.now();
    },
  },
});

module.exports = mongoose.model("ReccuringOrder", reccuringOrderSchema);
