const { authJwt, validate } = require("../middlewares");
const controller = require("../controllers/milestone.controller");
const { milestone: schema } = require("../validationSchemas");
var router = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("milestone_create"),
    validate(schema.create),
    controller.create
  );
  router.put(
    "/:_id",
    authJwt.verifyToken("milestone_update"),
    validate(schema.update),
    controller.update
  );
  router.get(
    "/:_id?",
    authJwt.verifyToken("milestone_read"),
    controller.findAll
  );

  router.delete(
    "/:_id",
    authJwt.verifyToken("milestone_delete"),
    controller.delete
  );

  app.use("/api/milestones", router);
};
