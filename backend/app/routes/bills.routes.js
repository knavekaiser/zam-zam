const { authJwt, validate, file } = require("../middlewares");
const controller = require("../controllers/bill.controller");
const { bill: schema } = require("../validationSchemas");
const { appConfig } = require("../config");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("bill_create"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "bill_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
    validate(schema.create),
    controller.create
  );
  router.put(
    "/:_id",
    authJwt.verifyToken("bill_update"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "bill_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
    validate(schema.update),
    controller.update
  );
  router.get(
    "/materials",
    authJwt.verifyToken("bill_read"),
    controller.getMaterials
  );
  router.get(
    "/items",
    authJwt.verifyToken("bill_read"),
    controller.getBillItems
  );
  router.get(
    "/charges",
    authJwt.verifyToken("bill_read"),
    controller.getBillCharges
  );
  router.get("/:_id?", authJwt.verifyToken("bill_read"), controller.findAll);

  router.delete("/:_id", authJwt.verifyToken("bill_delete"), controller.delete);

  router.post(
    "/:_id/payments",
    authJwt.verifyToken("bill_update"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "bill_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
    validate(schema.addPayment),
    controller.addPayment
  );
  router.put(
    "/:_id/payments/:paymentId",
    authJwt.verifyToken("bill_update"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "bill_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
    validate(schema.updatePayment),
    controller.updatePayment
  );
  router.delete(
    "/:_id/payments/:paymentId",
    authJwt.verifyToken("bill_update"),
    validate(schema.deletePayment),
    controller.deletePayment
  );

  app.use("/api/bills", router);
};
