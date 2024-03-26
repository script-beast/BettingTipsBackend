const jwt = require("jsonwebtoken");
const adminModel = require("../../models/admin.model");
const bcrypt = require("bcryptjs");

const adminValid = require("../../validations/admin.joi");

const routes = {};

routes.createUser = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const { error } = adminValid.createAdminValidation.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await adminModel.findOne({ email });

    if (user) {
      return res.status(404).json({ error: "email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await adminModel.create({
      email,
      name,
      password: hashedPassword,
    });

    return res.status(201).json({ msg: "success", dta: newUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { error } = adminValid.loginValidation.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await adminModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "email not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(404).json({ error: "invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1y",
    });

    return res.status(201).json({ msg: "success", dta: token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

module.exports = routes;
