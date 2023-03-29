const { authJwt, validate } = require("../middlewares");
const controller = require("../controllers/common.controller");
const { common: schema } = require("../validationSchemas");
var router = require("express").Router();

module.exports = function (app) {
  router.get(
    "/dashboard-data",
    authJwt.verifyToken(),
    controller.dashboardData
  );

  router.post("/devices", validate(schema.addDevice), controller.addDevice);
  router.post("/auto-bug-report", controller.autoBugReport);

  app.use("/api", router);
};
