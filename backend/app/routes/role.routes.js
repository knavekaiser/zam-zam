const { authJwt, validate } = require("../middlewares");
const controller = require("../controllers/role.controller");
const { role: schema } = require("../validationSchemas");
const router = require("express").Router();
const permissionRouter = require("express").Router();

module.exports = function (app) {
  router.post(
    "/",
    authJwt.verifyToken("role_create"),
    validate(schema.create),
    controller.create
  );
  router.put(
    "/:id",
    authJwt.verifyToken("role_update"),
    validate(schema.update),
    controller.update
  );
  router.get("/:id?", authJwt.verifyToken("role_read"), controller.findAll);
  router.delete("/:id?", authJwt.verifyToken("role_delete"), controller.delete);

  app.use("/api/roles", router);

  permissionRouter.get("/", authJwt.verifyToken(), controller.getPermissions);
  app.use("/api/permissions", permissionRouter);
};
