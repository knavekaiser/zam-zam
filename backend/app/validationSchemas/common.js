const yup = require("yup");
const { Member } = require("../models");

module.exports = {
  addDevice: yup.object({
    body: yup.object({
      name: yup.string(),
      platform: yup.string().required(),
    }),
  }),
};
