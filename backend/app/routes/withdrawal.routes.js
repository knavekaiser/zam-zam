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
    "/:id",
    authJwt.verifyToken("withdrawal_update"),
    validate(schema.update),
    controller.update
  );
  router.put(
    "/:id/approve",
    authJwt.verifyToken("withdrawal_approve"),
    controller.approve
  );
  router.get(
    "/:id?",
    authJwt.verifyToken("withdrawal_read"),
    controller.findAll
  );

  router.delete(
    "/:id",
    authJwt.verifyToken("withdrawal_delete"),
    controller.delete
  );
  router.delete(
    "/:id/request",
    authJwt.verifyToken("withdrawal_request_delete"),
    controller.reqDelete
  );

  app.use("/api/withdrawals", router);
};
