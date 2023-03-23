const { validate } = require("./validation");

module.exports = {
  authJwt: require("./authJwt"),
  file: require("./file"),
  validate,
  whitelabel: require("./whitelabel"),
};
