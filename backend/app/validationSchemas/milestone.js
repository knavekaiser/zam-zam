const yup = require("yup");
const { Member } = require("../models");

module.exports = {
  create: yup.object({
    body: yup.object({
      title: yup.string().required(),
      description: yup.string(),
      startDate: yup.date().required(),
      endDate: yup.date().required(),
      amount: yup.number().min(1, "Amount can't be less that 1").required(),
    }),
  }),

  update: yup.object({
    body: yup.object({
      title: yup.string().required(),
      description: yup.string(),
      startDate: yup.date().required(),
      endDate: yup.date().required(),
      amount: yup.number().min(1, "Amount can't be less that 1").required(),
    }),
  }),
};
