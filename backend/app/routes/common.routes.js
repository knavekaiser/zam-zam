const { authJwt } = require("../middlewares");
const controller = require("../controllers/common.controller");
var router = require("express").Router();

module.exports = function (app) {
  router.get(
    "/dashboard-data",
    authJwt.verifyToken(),
    controller.dashboardData
  );

  app.use("/api", router);
};
