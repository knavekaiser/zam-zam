const { authJwt, validate } = require("../middlewares");
const controller = require("../controllers/expense.controller");
const { expense: schema } = require("../validationSchemas");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken,
    validate(schema.create),
    controller.create
  );
  router.put(
    "/:id",
    authJwt.verifyToken,
    validate(schema.update),
    controller.update
  );
  router.put("/:id/approve", authJwt.verifyToken, controller.approve);
  router.get("/:id?", authJwt.verifyToken, controller.findAll);

  router.delete("/:id", authJwt.verifyToken, controller.delete);
  router.delete("/:id/request", authJwt.verifyToken, controller.reqDelete);

  app.use("/api/expenses", router);
};
