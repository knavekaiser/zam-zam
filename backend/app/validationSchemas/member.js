const yup = require("yup");
const commonYup = require("./commonYup");
const { Member } = require("../models");

module.exports = {
  signup: yup.object({
    body: yup.object({
      name: yup.string().required(),
      phone: yup
        .string()
        .phone()
        .required()
        .test("checkPhone", "Phone number already in use", (v) =>
          Member.findOne({ phone: v }).then((user) => !user)
        ),
      password: commonYup.password.required(),
    }),
  }),

  login: yup.object({
    body: yup.object({
      phone: yup.string().required(),
      password: yup.string().required(),
    }),
  }),

  forgotPassword: yup.object({
    body: yup.object({
      phone: yup
        .string()
        .required()
        .test("checkPhone", "Account not found", (v) =>
          Member.findOne({ phone: v })
        ),
    }),
  }),

  resetPassword: yup.object({
    body: yup.object({
      phone: yup
        .string()
        .required()
        .test("checkPhone", "Account not found", (v) =>
          Member.findOne({ phone: v })
        ),
      code: yup.string().required(),
      password: commonYup.password.required(),
    }),
  }),

  update: yup.object({
    body: yup.object({
      name: yup.string().min(3),
      phone: yup.string(),
      // .test("checkPhone", "Phone number already in use", (v) =>
      //   User.findOne({ phone: v }).then((user) => !user)
      // ),
      password: commonYup.password,
      address: yup.string(),
    }),
  }),
};
