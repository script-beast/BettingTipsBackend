const storeModel = require("../../models/store.model");

const adminValid = require("../../validations/admin.joi");

const routes = {};

routes.allStores = async (req, res) => {
  const { page } = req.query;

  try {
    const store = await storeModel.find({
      isDeleted: false,
    });

    const limit = 10;
    const totalPages = Math.ceil(store.length / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = store.slice(startIndex, endIndex);

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

routes.storesById = async (req, res) => {
  const { id } = req.params;

  try {
    const store = await storeModel.findById(id);

    if (!store) {
      return res.status(404).json({ error: "store not found" });
    }

    return res.status(201).json({ msg: "success", dta: store });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.addStore = async (req, res) => {
  const { name, price, credits } = req.body;

  const { error } = adminValid.addStoreValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const newStore = await storeModel.create({
      name,
      price: parseFloat(price).toFixed(2) || 0,
      credits,
    });

    return res.status(201).json({ msg: "success", dta: newStore });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.updateStore = async (req, res) => {
  const { id } = req.params;
  const { name, price, credits } = req.body;

  const { error } = adminValid.addStoreValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const store = await storeModel.findById(id);
    if (!store) {
      return res.status(404).json({ error: "Item not found" });
    }

    const updateStore = await storeModel.findOneAndUpdate(
      { _id: id },
      {
        name,
        price: parseFloat(price).toFixed(2) || 0,
        credits,
      },
      { new: true }
    );

    return res.status(201).json({ msg: "success", dta: updateStore });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.deleteStore = async (req, res) => {
  const { id } = req.params;

  try {
    const store = await storeModel.findById(id);
    if (!store) {
      return res.status(404).json({ error: "Item not found" });
    }

    const updateStore = await storeModel.findOneAndUpdate(
      { _id: id },
      { isDeleted: true },
      { new: true }
    );

    return res.status(201).json({ msg: "success", dta: updateStore });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

module.exports = routes;
