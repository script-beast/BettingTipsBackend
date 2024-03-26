const Joi = require("joi");

const createUserValidation = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  mobile: Joi.number().required(),
  refBy: Joi.string(),
  password: Joi.string().required(),
});

const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const resetPasswordOTPValidation = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordValidation = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.number().required(),
  password: Joi.string().required(),
});

const contactUsValidation = Joi.object({
  fName: Joi.string().required(),
  lName: Joi.string().required(),
  email: Joi.string().email().required(),
  mobile: Joi.number().required(),
  message: Joi.string().required(),
});

// name, mobile, currentPassword, newPassword
const updateProfileValidation = Joi.object({
  name: Joi.string().required(),
  mobile: Joi.number().required(),
  currentPassword: Joi.string(),
  newPassword: Joi.string(),
});

const buyPackageValidation = Joi.object({
  packageId: Joi.string().required(),
  amount: Joi.number().required().strict(),
});

const validPaymentPackageValidation = Joi.object({
  packageId: Joi.string().required(),
  paymentIntentId: Joi.string().required(),
  walletDeduction: Joi.number().required().strict(),
  cardDeduction: Joi.number().required().strict(),
});

const buyVslPackageValidation = Joi.object({
  packageId: Joi.string().required(),
  amount: Joi.number().required().strict(),
});

const validPaymentVslPackageValidation = Joi.object({
  packageId: Joi.string().required(),
  paymentIntentId: Joi.string().required(),
  walletDeduction: Joi.number().required().strict(),
  cardDeduction: Joi.number().required().strict(),
});

const walletWithdrawPackageValidation = Joi.object({
  packageId: Joi.string().required(),
  amount: Joi.number().required().strict(),
});

const walletWithdrawVslPackageValidation = Joi.object({
  packageId: Joi.string().required(),
});

module.exports = {
  createUserValidation,
  loginValidation,
  resetPasswordOTPValidation,
  resetPasswordValidation,
  contactUsValidation,
  updateProfileValidation,
  buyPackageValidation,
  validPaymentPackageValidation,
  buyVslPackageValidation,
  validPaymentVslPackageValidation,
  walletWithdrawPackageValidation,
  walletWithdrawVslPackageValidation,
};
// export {
//   addVehicleValidation,
//   emailValidation,
//   registerValidation,
//   loginValidation,
//   createAdminValidation,
// };
