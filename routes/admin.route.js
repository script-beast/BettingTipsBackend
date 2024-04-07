const express = require("express");
const controller = require("../controllers/admin.controller");
const auth = require("../middlewares/admin.middleware");

const router = express.Router();

router.post("/signup", controller.createUser);
router.post("/login", controller.login);
router.get("/allUsers", auth, controller.allUsers);
router.post("/changeUserBalance/:userId", auth, controller.changeUserBalance);
router.get("/allPackages", auth, controller.allPackages);
router.get("/allSpecialPackages", auth, controller.allSpecialPackages);
router.get("/allStore", auth, controller.allStores);
router.get("/getstore/:id", auth, controller.storesById);
router.get("/pastPackages", auth, controller.pastPackages);
router.get("/getPackage/:id", auth, controller.packageById);
router.get("/getPackagePageCount/:id", auth, controller.getPackagePageCount);
router.get("/getSpecialPackage/:id", auth, controller.specialPackageById);
router.get("/allVslPackages", auth, controller.allVslPackages);
router.get("/getVslPackage/:id", auth, controller.vslPackageById);
router.get("/contactedusers", auth, controller.allContacts);
router.get("/allOrders", auth, controller.allOrders);
router.get("/overview", auth, controller.overview);
router.post("/createPackage", auth, controller.addPackage);
router.post("/createSpecialPackage", auth, controller.addSpecialPackage);
router.post("/createStore", auth, controller.addStore);
router.post("/createVslPackage", auth, controller.addVslPackage);
router.patch("/updatePackageStatus/:id", auth, controller.updatePackageStatus);
router.patch(
  "/updateVslPackageStatus/:id",
  auth,
  controller.updateVslPackageStatus,
);
router.put("/updatePackage/:id", auth, controller.updatePackage);
router.post("/giftPackage", auth, controller.giftPackage);
router.put("/updateSpecialPackage/:id", auth, controller.updateSpecialPackage);
router.put("/updateVslPackage/:id", auth, controller.updateVslPackage);
router.put("/updateStore/:id", auth, controller.updateStore);
router.delete("/deletePackage/:id", auth, controller.deletePackage);
router.delete(
  "/deleteSpecialPackage/:id",
  auth,
  controller.deleteSpecialPackage,
);
router.delete("/deleteStore/:id", auth, controller.deleteStore);
router.delete("/deleteVslPackage/:id", auth, controller.deleteVslPackage);
router.get("/deletedPackages", auth, controller.deletedPackages);
router.get("/deletedVslPackages", auth, controller.deletedVslPackages);
router.get("/deletedSpecialPackages", auth, controller.deletedSpecialPackage);
router.get("/bulkPackageMail", auth, controller.bulkPackageMail);
router.post("/bulkCustomMail", auth, controller.bulkCustomMail);
router.get("/getUser/:id", auth, controller.getUserById);
router.patch("/updateUserStatus/:id", auth, controller.updateUserStatus);
router.get("/directupdate", auth, controller.directupdate);

module.exports = router;
