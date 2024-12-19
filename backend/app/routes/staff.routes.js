const { authJwt, file, validate } = require("../middlewares");
const { appConfig } = require("../config");
const controller = require("../controllers/staff.controller");
const { staff: schema } = require("../validationSchemas");
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
    file.upload([
      {
        name: "photo",
        store: "keyOnly",
        pathname: "member_profile/",
        mimetype: appConfig.supportedImageSizes,
        size: appConfig.supportedImageTypes,
      },
    ]),
    validate(schema.update),
    controller.updateProfile
  );

  //------------------------- Management
  router.get("/", authJwt.verifyToken("staff_read"), controller.find);
  router.put(
    "/:_id/activate",
    authJwt.verifyToken("staff_approve"),
    controller.activate
  );
  router.put("/:_id", authJwt.verifyToken("staff_update"), controller.update);

  app.use("/api/staffs", router);
};
