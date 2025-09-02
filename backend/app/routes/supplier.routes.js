const { authJwt, validate, file } = require("../middlewares");
const controller = require("../controllers/supplier.controller");
const { supplier: schema } = require("../validationSchemas");
const { appConfig } = require("../config");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("supplier_create"),
    validate(schema.create),
    controller.create
  );

  router.get(
    "/:_id/payments",
    authJwt.verifyToken("bill_create"),
    controller.getPayments
  );
  router.post(
    "/:_id/payments",
    authJwt.verifyToken("bill_create"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "supplier_payment_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
    validate(schema.makePayment),
    controller.makePayment
  );
  router.put(
    "/:_id/payments/:paymentId",
    authJwt.verifyToken("bill_update"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "supplier_payment_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
    validate(schema.makePayment),
    controller.updatePayment
  );
  router.delete(
    "/:_id/payments/:paymentId",
    authJwt.verifyToken("bill_delete"),
    validate(schema.removePayment),
    controller.deletePayment
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
