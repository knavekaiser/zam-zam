const { authJwt, validate } = require("../middlewares");
const controller = require("../controllers/supplier.controller");
const { supplier: schema } = require("../validationSchemas");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("supplier_create"),
    validate(schema.create),
    controller.create
  );
  router.post(
    "/:_id/payments",
    authJwt.verifyToken("bill_create"),
    validate(schema.makePayment),
    controller.makePayment
  );
  router.put(
    "/:_id",
    authJwt.verifyToken("supplier_update"),
    validate(schema.update),
    controller.update
  );
  router.get(
    "/:_id?",
    authJwt.verifyToken("supplier_read"),
    controller.findAll
  );

  router.delete(
    "/:_id",
    authJwt.verifyToken("supplier_delete"),
    controller.delete
  );

  app.use("/api/suppliers", router);
};
