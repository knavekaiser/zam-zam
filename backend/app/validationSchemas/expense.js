const yup = require("yup");

module.exports = {
  create: yup.object({
    body: yup.object({
      tags: yup.array().of(yup.string().trim()),
      date: yup.date().required(),
      amount: yup.number().min(1, "Amount can't be less that 1").required(),
      description: yup.string().required(),
    }),
  }),

  update: yup.object({
    body: yup.object({
      tags: yup.array().of(yup.string().trim()),
      date: yup.date().required(),
      amount: yup.number().min(1, "Amount can't be less that 1").required(),
      description: yup.string().required(),
    }),
  }),
};
