const { authJwt, validate } = require("../middlewares");
const controller = require("../controllers/deposit.controller");
const { deposit: schema } = require("../validationSchemas");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("deposit_create"),
    validate(schema.create),
    controller.create
  );
  router.put(
    "/:_id",
    authJwt.verifyToken("deposit_update"),
    validate(schema.update),
    controller.update
  );
  router.put(
    "/:_id/approve",
    authJwt.verifyToken("deposit_approve"),
    controller.approve
  );
  router.get("/:_id?", authJwt.verifyToken("deposit_read"), controller.findAll);

  router.delete(
    "/:_id",
    authJwt.verifyToken("deposit_delete"),
    controller.delete
  );
  router.delete(
    "/:_id/request",
    authJwt.verifyToken("deposit_request_delete"),
    controller.reqDelete
  );

  app.use("/api/deposits", router);
};
