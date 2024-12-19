const yup = require("yup");

module.exports = {
  addDevice: yup.object({
    body: yup.object({
      name: yup.string(),
      platform: yup.string().required(),
    }),
  }),
};
