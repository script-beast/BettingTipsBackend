const orderHistoryModel = require("../../models/orderHistory.model");

const routes = {};

routes.allOrders = async (req, res) => {
  const { page } = req.query;
  try {
    // reverse order
    const orders = await orderHistoryModel
      .find()
      .populate("user")
      .populate("package")
      .populate("vslPackage")
      .sort({ createdAt: -1 });

    // orders.reverse();

    const limit = 10;
    const totalPages = Math.ceil(orders.length / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = orders.slice(startIndex, endIndex);

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

module.exports = routes;
