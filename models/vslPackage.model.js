const mongoose = require("mongoose");

const vslPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  actPrice: {
    type: Number,
    required: true,
  },
  discountedPrice: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  saleTitle: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  gamePreview: {
    type: String,
    required: true,
  },
  bets: {
    type: Array,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive",
  },
  runningStatus: {
    type: Boolean,
    default: false,
  },
  pageCount: {
    type: Number,
    default: 0,
  },
  result: {
    type: String,
    enum: ["win", "lose", "tie", "pending"],
    default: "pending",
  },
  videoURL: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: function () {
      return Date.now();
    },
  },
});

module.exports = mongoose.model("vslPackage", vslPackageSchema);
