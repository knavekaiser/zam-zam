const { authJwt, validate, file } = require("../middlewares");
const controller = require("../controllers/income.controller");
const { expense: schema } = require("../validationSchemas");
const { appConfig } = require("../config");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("income_create"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "income_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
    validate(schema.create),
    controller.create
  );
  router.put(
    "/:_id",
    authJwt.verifyToken("income_update"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "income_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
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
