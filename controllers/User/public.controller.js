const contactModel = require("../../models/contact.model");

const userValid = require("../../validations/user.joi");

const routes = {};

routes.contactUs = async (req, res) => {
  try {
    const { fName, lName, email, mobile, message } = req.body;

    const { error } = userValid.contactUsValidation.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const newContact = await contactModel.create({
      fName,
      lName,
      email,
      mobile,
      message,
    });

    return res.status(200).json({ msg: "success", dta: newContact });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

module.exports = routes;
