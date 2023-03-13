const yup = require("yup");

module.exports = {
  create: yup.object({
    body: yup.object({
      member: yup.string().objectId().required(),
      date: yup.date().required(),
      amount: yup.number().min(1, "Amount can't be less that 1").required(),
      remark: yup.string(),
    }),
  }),

  update: yup.object({
    body: yup.object({
      member: yup.string().objectId().required(),
      date: yup.date().required(),
      amount: yup.number().min(1, "Amount can't be less that 1").required(),
      remark: yup.string(),
    }),
  }),
};
