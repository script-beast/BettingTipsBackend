const Express = require("express");
const userController = require("../controllers/user.controller");
const auth = require("../middlewares/user.middleware");
const passport = require("passport");

const router = Express.Router();

router.post("/signup", userController.createUser);
router.post("/refreshtoken", userController.refreshAccessToken);
router.get("/getBonus", auth, userController.getBonus);
router.post("/login", userController.login);
router.post("/generateOTP", userController.generateOTP);
router.post("/verifyAccount", userController.verifyAccount);
router.post("/resetPassOTP", userController.resetPassOTP);
router.post("/resetPass", userController.resetpassword);
router.get("/allPackage", userController.allActivePackages);
router.get("/allSpecialPackages", userController.allSpecialPackages);
router.get("/allStore", auth, userController.allStores);
router.get("/getstore/:id", auth, userController.storesById);
router.get("/getPackage/:id", auth, userController.getPackage);
router.get("/getVslPackage/:id", auth, userController.getVslPackage);
router.get("/getSpecialPackage/:id", auth, userController.getSpecialPackage);
router.post("/contact", userController.contactUs);
router.get("/getProfile", auth, userController.userDashboard);
router.get("/getProfileShort", auth, userController.getProfileShort);
router.get("/getMyPackages", auth, userController.getMyPackages);
router.get("/getTransactions", auth, userController.getTransactions);
router.get(
  "/getRecurringTransactions",
  auth,
  userController.getRecurringTransactions,
);
router.patch("/updateProfile", auth, userController.updateProfile);
router.patch("/updateAddress", auth, userController.updateAddress);
router.post("/createIntentPackage", auth, userController.buyPackage);
router.post("/validatePaymentPackage", userController.validPaymentPackage);
router.post("/createIntentVslPackage", auth, userController.buyVslPackage);
router.post(
  "/validatePaymentVslPackage",
  auth,
  userController.validPaymentVslPackage,
);
router.post(
  "/walletWithdrawPackage",
  auth,
  userController.walletWithdrawPackage,
);
router.post(
  "/walletWithdrawVslPackage",
  auth,
  userController.walletWithdrawVslPackage,
);
router.post("/createIntentStore", auth, userController.buyStore);
router.post("/validatePaymentStore", userController.validPaymentStore);
router.post(
  "/createIntentSpecialPackage",
  auth,
  userController.buySpecialPackage,
);
router.post(
  "/validatePaymentSpecialPackage",
  userController.validPaymentSpecialPackage,
);

router.post("/addItemToCart", auth, userController.addItemToCart);
router.patch("/removeItemFromCart", auth, userController.removeItemFromCart);
router.get("/getCart", auth, userController.getCart);
router.delete("/clearCart", auth, userController.clearCart);
router.post("/createIntentCart", auth, userController.createIntentCart);
router.post("/validatePaymentCart", userController.validPaymentCart);
router.post("/walletWithdrawCart", auth, userController.walletWithdrawCart);
router.get("/getReferredUsers", auth, userController.getReferredUsers);

router.post(
  "/createReccuringOrderMonthly",
  auth,
  userController.createReccuringOrderMonthly,
);
router.post(
  "/validPaymentReccuringOrderMonthly",
  userController.validPaymentReccuringOrderMonthly,
);

router.post(
  "/createReccuringOrderYearly",
  auth,
  userController.createReccuringOrderYearly,
);

router.post(
  "/validPaymentReccuringOrderYearly",
  userController.validPaymentReccuringOrderYearly,
);

router.delete(
  "/cancelRecurringOrder/:id",
  auth,
  userController.cancelRecurringOrder,
);

// New Payment Routes
router.post("/buyPackageAuthorize", auth, userController.buyPackageAuthorize);
router.post("/buyStoreAuthorize", auth, userController.buyStoreAuthorize);
router.post(
  "/createReccuringOrderMonthlyAuthorize",
  auth,
  userController.createReccuringOrderMonthlyAuthorize,
);
router.post(
  "/createReccuringOrderYearlyAuthorize",
  auth,
  userController.createReccuringOrderYearlyAuthorize,
);
router.delete(
  "/cancelRecurringOrderAuthorize/:id",
  auth,
  userController.cancelRecurringOrderAuthorize,
);
router.post("/paymentCartAuthorize", auth, userController.paymentCartAuthorize);
// -----------------------

// router.get("/auth/facebook", userController.facebook);
// router.get("/auth/facebook/callback", userController.facebookCallback);
// router.get("/auth/apple", userController.apple);
// router.get("/auth/apple/callback", userController.appleCallback);
router.get("/auth/success", userController.success);

router.get("/auth/google", userController.google);
router.get("/auth/google/callback", userController.googleCallback);

module.exports = router;
