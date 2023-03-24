const { authJwt, file, validate } = require("../middlewares");
const { appConfig } = require("../config");
const controller = require("../controllers/member.controller");
const { member: schema } = require("../validationSchemas");
var router = require("express").Router();

module.exports = function (app) {
  //-------------------------- Auth
  router.post("/signup", validate(schema.signup), controller.signup);
  router.post("/signin", validate(schema.login), controller.login);
  router.post(
    "/forgot-password",
    validate(schema.forgotPassword),
    controller.forgotPassword
  );
  router.post(
    "/reset-password",
    validate(schema.resetPassword),
    controller.resetPassword
  );
  router.post("/logout", authJwt.verifyToken(), controller.logout);

  //-------------------------- Profile
  router.get("/profile", authJwt.verifyToken(), controller.profile);
  router.put(
    "/profile",
    authJwt.verifyToken(),
    file.upload({ name: "photo" }, "/", {
      fileSize: appConfig.supportedImageSizes,
      fileTypes: appConfig.supportedImageTypes,
      override: true,
    }),
    validate(schema.update),
    controller.updateProfile
  );

  //------------------------- Management
  router.post("/", authJwt.verifyToken("member_create"), controller.create);
  router.get("/", authJwt.verifyToken("member_read"), controller.get);
  router.get("/find", authJwt.verifyToken(), controller.find);
  router.put(
    "/:_id/activate",
    authJwt.verifyToken("member_approve"),
    controller.activate
  );
  router.put("/:_id", authJwt.verifyToken("member_update"), controller.update);
  router.delete(
    "/:_id",
    authJwt.verifyToken("member_delete"),
    controller.delete
  );

  app.use("/api/members", router);
};
