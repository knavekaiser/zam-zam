const yup = require("yup");
const { Member, Milestone } = require("../models");

module.exports = {
  create: yup.object({
    body: yup.object({
      name: yup.string().required(),
      phones: yup.array().of(yup.string().phone()).required(),
      address: yup.string(),
    }),
  }),

  update: yup.object({
    body: yup.object({
      name: yup.string().required(),
      phones: yup.array().of(yup.string().phone()).required(),
      address: yup.string(),
    }),
  }),
};
