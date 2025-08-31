const yup = require("yup");
const commonYup = require("./commonYup");
const { Member, Device } = require("../models");

module.exports = {
  signup: yup.object({
    body: yup.object({
      // deviceId: yup
      //   .string()
      // .required("deviceId is required")
      // .test("deviceId", "Please pass a valid device ID", (v) =>
      //   Device.findOne({ deviceId: v })
      // ),
      name: yup.string().trim().required(),
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
      // deviceId: yup
      //   .string()
      // .required("deviceId is required")
      // .test("deviceId", "Please pass a valid device ID", (v) =>
      //   Device.findOne({ deviceId: v })
      // ),
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
      name: yup.string().trim().min(3),
      phone: yup.string(),
      // .test("checkPhone", "Phone number already in use", (v) =>
      //   User.findOne({ phone: v }).then((user) => !user)
      // ),
      password: commonYup.password,
      oldPassword: yup
        .string()
        .when("password", (password, schema) =>
          password ? schema.required("Please enter the old password") : schema
        ),
      address: yup.string(),
    }),
  }),

  sendMessage: yup.object({
    body: yup.object({
      members: yup
        .array()
        .of(
          yup
            .string()
            .typeError("Please provide a valid member id")
            .objectId()
            .required()
        ),
      message: yup
        .string()
        .required()
        .max(250, "Enter less than 250 characters"),
    }),
  }),
};
