const yup = require("yup");
const commonYup = require("./commonYup");
const { Staff, Device } = require("../models");

module.exports = {
  signup: yup.object({
    body: yup.object({
      deviceId: yup
        .string()
        .required("deviceId is required")
        .test("deviceId", "Please pass a valid device ID", (v) =>
          Device.findOne({ deviceId: v })
        )
        .typeError("deviceId is required"),
      name: yup.string().required(),
      phone: yup
        .string()
        .phone()
        .required()
        .test("checkPhone", "Phone number already in use", (v) =>
          Staff.findOne({ phone: v }).then((user) => !user)
        ),
      password: commonYup.password.required(),
    }),
  }),

  login: yup.object({
    body: yup.object({
      deviceId: yup
        .string()
        .required("deviceId is required")
        .test("deviceId", "Please pass a valid device ID", (v) =>
          Device.findOne({ deviceId: v })
        )
        .typeError("deviceId is required"),
      phone: yup.string().phone().required(),
      password: yup.string().required(),
    }),
  }),

  forgotPassword: yup.object({
    body: yup.object({
      phone: yup
        .string()
        .phone()
        .required()
        .test("checkPhone", "Account not found", (v) =>
          Staff.findOne({ phone: v })
        ),
    }),
  }),

  resetPassword: yup.object({
    body: yup.object({
      phone: yup
        .string()
        .phone()
        .required()
        .test("checkPhone", "Account not found", (v) =>
          Staff.findOne({ phone: v })
        ),
      code: yup.string().required(),
      password: commonYup.password.required(),
    }),
  }),

  update: yup.object({
    body: yup.object({
      name: yup.string().min(3),
      phone: yup.string().phone(),
      // .test("checkPhone", "Phone number already in use", (v) =>
      //   User.findOne({ phone: v }).then((user) => !user)
      // ),
      password: commonYup.password,
      address: yup.string(),
    }),
  }),
};
