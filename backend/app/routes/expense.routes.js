const { authJwt, validate, file } = require("../middlewares");
const controller = require("../controllers/expense.controller");
const { expense: schema } = require("../validationSchemas");
const { appConfig } = require("../config");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("expense_create"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "expense_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
    validate(schema.create),
    controller.create
  );
  router.get(
    "/categories",
    authJwt.verifyToken("expense_read"),
    controller.getExpCategories
  );
  router.put(
    "/:_id",
    authJwt.verifyToken("expense_update"),
    file.upload([
      {
        name: "documents",
        multiple: true,
        maxCount: 5,
        pathname: "expense_docs/",
        mimetype: appConfig.supportedDocSizes,
        size: appConfig.supportedDocTypes,
      },
    ]),
    validate(schema.update),
    controller.update
  );
  router.put(
    "/:_id/approve",
    authJwt.verifyToken("expense_approve"),
    controller.approve
  );
  router.get("/:_id?", authJwt.verifyToken("expense_read"), controller.findAll);

  router.delete(
    "/:_id",
    authJwt.verifyToken("expense_delete"),
    controller.delete
  );
  router.delete(
    "/:_id/request",
    authJwt.verifyToken("expense_request_delete"),
    controller.reqDelete
  );

  app.use("/api/expenses", router);
};
