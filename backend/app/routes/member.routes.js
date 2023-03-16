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
  router.post("/logout", controller.logout);

  //-------------------------- Profile
  router.get("/profile", authJwt.verifyToken, controller.profile);
  router.put(
    "/profile",
    authJwt.verifyToken,
    file.upload({ name: "photo" }, "/", {
      fileSize: appConfig.supportedImageSizes,
      fileTypes: appConfig.supportedImageTypes,
      override: true,
    }),
    validate(schema.update),
    controller.updateProfile
  );

  //------------------------- Management
  router.post("/", authJwt.verifyToken, controller.create);
  router.get("/", authJwt.verifyToken, controller.get);
  router.get("/find", authJwt.verifyToken, controller.find);
  router.put("/:_id/activate", authJwt.verifyToken, controller.activate);
  router.put("/:_id", authJwt.verifyToken, controller.update);

  app.use("/api/members", router);
};
