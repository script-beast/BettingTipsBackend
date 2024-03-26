const accountUser = require("./User/account.controller");
const profileUser = require("./User/profile.controller");
const cartUser = require("./User/cart.controller");
const packageUser = require("./User/package.controller");
const publicUser = require("./User/public.controller");
const specialPackageUser = require("./User/specialPackage.controller");
const storeUser = require("./User/store.controller");
const vslPackageUser = require("./User/vslPackage.controller");
const authUser = require("./User/auth.controller");

const routes = {
  ...accountUser,
  ...profileUser,
  ...cartUser,
  ...packageUser,
  ...publicUser,
  ...specialPackageUser,
  ...storeUser,
  ...vslPackageUser,
  ...authUser,
};

module.exports = routes;
