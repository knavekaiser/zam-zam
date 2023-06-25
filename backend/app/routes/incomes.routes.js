const { authJwt, validate } = require("../middlewares");
const controller = require("../controllers/income.controller");
const { expense: schema } = require("../validationSchemas");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("income_create"),
    validate(schema.create),
    controller.create
  );
  router.put(
    "/:_id",
    authJwt.verifyToken("income_update"),
    validate(schema.update),
    controller.update
  );
  router.put(
    "/:_id/approve",
    authJwt.verifyToken("income_approve"),
    controller.approve
  );
  router.get("/:_id?", authJwt.verifyToken("income_read"), controller.findAll);

  router.delete(
    "/:_id",
    authJwt.verifyToken("income_delete"),
    controller.delete
  );
  router.delete(
    "/:_id/request",
    authJwt.verifyToken("income_request_delete"),
    controller.reqDelete
  );

  app.use("/api/incomes", router);
};
