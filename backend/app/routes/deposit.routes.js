const { authJwt, validate, file } = require("../middlewares");
const controller = require("../controllers/deposit.controller");
const { deposit: schema } = require("../validationSchemas");
const { appConfig } = require("../config");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("deposit_create"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "deposit_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
    validate(schema.create),
    controller.create
  );
  router.put(
    "/:_id",
    authJwt.verifyToken("deposit_update"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "deposit_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
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
