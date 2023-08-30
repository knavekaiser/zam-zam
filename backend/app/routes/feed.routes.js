const { authJwt, validate, file } = require("../middlewares");
const controller = require("../controllers/feed.controller");
const { feed: schema } = require("../validationSchemas");
const { appConfig } = require("../config");
var router = require("express").Router();

module.exports = function (app) {
  router.get("/", authJwt.verifyToken(), controller.getFeed);
  router.post(
    "/",
    authJwt.verifyToken(),
    file.upload({ name: "media", multiple: true }, "feed_media", {
      fileSize: appConfig.supportedImageSizes,
      fileTypes: appConfig.supportedImageTypes,
    }),
    validate(schema.addPost),
    controller.post
  );
  router.put(
    "/:_id",
    authJwt.verifyToken(),
    file.upload({ name: "media", multiple: true }, "feed_media", {
      fileSize: appConfig.supportedImageSizes,
      fileTypes: appConfig.supportedImageTypes,
    }),
    validate(schema.addPost),
    controller.updatePost
  );
  router.post("/:_id/like", authJwt.verifyToken(), controller.likePost);
  router.post("/:_id/unlike", authJwt.verifyToken(), controller.unlikePost);
  router.delete("/:_id", authJwt.verifyToken(), controller.deletePost);

  // --------------------------------------------- Comments
  router.get(
    "/:parent_id/comments",
    authJwt.verifyToken(),
    controller.getComments
  );
  router.post(
    "/:parent_id/comments",
    authJwt.verifyToken(),
    file.upload({ name: "media", multiple: true }, "feed_media", {
      fileSize: appConfig.supportedImageSizes,
      fileTypes: appConfig.supportedImageTypes,
    }),
    controller.postComment
  );

  app.use("/api/feed", router);
};
