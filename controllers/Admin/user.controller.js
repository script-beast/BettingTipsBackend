const contactModel = require("../../models/contact.model");
const userModel = require("../../models/user.model");

const adminValid = require("../../validations/admin.joi");

const routes = {};

routes.allUsers = async (req, res) => {
  //apply pagination
  const { page = 1, name, mobile, email, sortBy } = req.query;

  try {
    const allusers = await userModel.find().sort({ createdAt: -1 });
    let users = [];

    if (name)
      users = allusers.filter((user) =>
        user.name.toLowerCase().includes(name.toLowerCase()),
      );
    if (mobile)
      users = allusers.filter((user) =>
        user.mobile.toString().includes(mobile),
      );

    if (email)
      users = allusers.filter((user) =>
        user.email.toLowerCase().includes(email.toLowerCase()),
      );

    if (!name && !mobile && !email) users = allusers;

    // console.log(users);

    if (sortBy) {
      if (sortBy === "asc") {
        users.sort((a, b) => a.package.length - b.package.length);
      } else if (sortBy === "desc") {
        users.sort((a, b) => b.package.length - a.package.length);
      }
    }

    const limit = 10;
    const totalPages = Math.ceil(users.length / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = users.slice(startIndex, endIndex);
    // console.log(result);

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

routes.changeUserBalance = async (req, res) => {
  const { userId } = req.params;
  const { wallet } = req.body;

  const { error } = adminValid.changeUserBalanceValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const user = userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { _id: userId },
      { wallet: wallet },
      { new: true },
    );

    return res.status(201).json({ msg: "success", dta: updatedUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.allContacts = async (req, res) => {
  const { page } = req.query;

  try {
    const contacts = await contactModel.find().sort({ createdAt: -1 });

    const limit = 10;
    const totalPages = Math.ceil(contacts.length / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = contacts.slice(startIndex, endIndex);

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

routes.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userModel.findOne({ _id: id });

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(201).json({ msg: "success", dta: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status, remark } = req.body;

  try {
    const user = await userModel.findOneAndUpdate(
      { _id: id },
      {
        status,
        remark,
      },
      { new: true },
    );

    return res.status(201).json({ msg: "success", dta: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

module.exports = routes;
