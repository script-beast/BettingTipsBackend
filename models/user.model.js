const mongoose = require("mongoose");

const user = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: Number,
  },
  otpExpires: {
    type: Date,
  },
  password: {
    type: String,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  referralCode: {
    type: String,
    unique: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  status: {
    type: String,
    enum: ["active", "suspended", "deleted"],
    default: "active",
  },
  remark: {
    type: String,
    default: "No issue Found",
  },
  bonus: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  zip: {
    type: String,
  },
  country: {
    type: String,
  },
  company: {
    type: String,
  },
  package: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "package",
    },
  ],
  store: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "store",
    },
  ],
  vslPackage: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vslPackage",
    },
  ],
  specialPackage: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "specialPackage",
    },
  ],
  reccuringOrder: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reccuringOrder",
    },
  ],
  orderHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orderHistory",
    },
  ],
  cart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "package",
    },
  ],
  stripeCustomerId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: function () {
      return Date.now();
    },
  },
});

module.exports = mongoose.model("user", user);
//  mongoose.model("user", user);
