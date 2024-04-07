const mongoose = require("mongoose");

const orderHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "package",
  },
  vslPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "vslPackage",
  },
  specialPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "specialPackage",
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "store",
  },
  cart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "package",
    },
  ],
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive",
  },
  desc: {
    type: String,
  },
  price: {
    type: Number,
  },
  type: {
    type: String,
    enum: ["Credit", "Debit", "Recuring"],
  },
  method: {
    type: String,
    enum: ["Wallet", "Card"],
  },
  createdAt: {
    type: Date,
    default: function () {
      return Date.now();
    },
  },
});

module.exports = mongoose.model("orderHistory", orderHistorySchema);
