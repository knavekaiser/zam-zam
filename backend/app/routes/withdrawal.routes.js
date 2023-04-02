const { authJwt, validate } = require("../middlewares");
const controller = require("../controllers/withdrawal.controller");
const { withdrawal: schema } = require("../validationSchemas");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("withdrawal_create"),
    validate(schema.create),
    controller.create
  );
  router.put(
    "/:_id",
    authJwt.verifyToken("withdrawal_update"),
    validate(schema.update),
    controller.update
  );
  router.put(
    "/:_id/approve",
    authJwt.verifyToken("withdrawal_approve"),
    controller.approve
  );
  router.get(
    "/:_id?",
    authJwt.verifyToken("withdrawal_read"),
    controller.findAll
  );

  router.delete(
    "/:_id",
    authJwt.verifyToken("withdrawal_delete"),
    controller.delete
  );
  router.delete(
    "/:_id/request",
    authJwt.verifyToken("withdrawal_request_delete"),
    controller.reqDelete
  );

  app.use("/api/withdrawals", router);
};
