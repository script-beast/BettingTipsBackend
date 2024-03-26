const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  // date: {
  //   type: Date,
  //   required: true,
  // },
  sports: {
    type: String,
    default: "Others",
  },
  category: {
    type: String,
    default: "Others",
  },
  endDate: {
    type: Date,
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
  videoURL: {
    type: String,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive",
  },
  pageCount: {
    type: Number,
    default: 0,
  },
  runningStatus: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  result: {
    type: String,
    enum: ["win", "lose", "tie", "pending"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: function () {
      return Date.now();
    },
  },
});

module.exports = mongoose.model("package", packageSchema);
