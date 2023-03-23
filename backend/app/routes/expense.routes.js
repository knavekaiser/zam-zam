const { authJwt, validate } = require("../middlewares");
const controller = require("../controllers/expense.controller");
const { expense: schema } = require("../validationSchemas");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("expense_create"),
    validate(schema.create),
    controller.create
  );
  router.put(
    "/:id",
    authJwt.verifyToken("expense_update"),
    validate(schema.update),
    controller.update
  );
  router.put(
    "/:id/approve",
    authJwt.verifyToken("expense_approve"),
    controller.approve
  );
  router.get("/:id?", authJwt.verifyToken("expense_read"), controller.findAll);

  router.delete(
    "/:id",
    authJwt.verifyToken("expense_delete"),
    controller.delete
  );
  router.delete(
    "/:id/request",
    authJwt.verifyToken("expense_request_delete"),
    controller.reqDelete
  );

  app.use("/api/expenses", router);
};
