const credAdmin = require("./Admin/cred.controller");
const dashboardAdmin = require("./Admin/dashboard.controller");
const storeAdmin = require("./Admin/store.controller");
const userAdmin = require("./Admin/user.controller");
const orderAdmin = require("./Admin/order.controller");
const packageAdmin = require("./Admin/package.controller");
const specialPackageAdmin = require("./Admin/specialPackage.controller");
const vslPackageAdmin = require("./Admin/vslPackage.controller");
const utilAdmin = require("./Admin/util.controller");

const routes = {
  ...credAdmin,
  ...dashboardAdmin,
  ...storeAdmin,
  ...userAdmin,
  ...orderAdmin,
  ...packageAdmin,
  ...specialPackageAdmin,
  ...vslPackageAdmin,
  ...utilAdmin,
};

module.exports = routes;
