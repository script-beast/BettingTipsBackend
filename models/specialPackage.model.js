const mongoose = require("mongoose");

const specialPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  monthlyPrice: {
    type: Number,
    default: 0,
  },
  yearlyPrice: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    required: true,
  },
  gamePreview: {
    type: String,
    required: true,
  },
  links: {
    type: Array,
  },
  videoURL: {
    type: String,
  },
  discount: {
    type: Number,
    default: 0,
  },
  pageCount: {
    type: Number,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  stripeProductId: {
    type: String,
  },
  stripeMonthlyPriceId: {
    type: String,
  },
  stripeYearlyPriceId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: function () {
      return Date.now();
    },
  },
});

module.exports = mongoose.model("specialPackage", specialPackageSchema);
