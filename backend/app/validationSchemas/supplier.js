const yup = require("yup");
const { Supplier } = require("../models");

module.exports = {
  create: yup.object({
    body: yup.object({
      name: yup.string().trim().required(),
      phones: yup.array().of(yup.string().phone()).required(),
      address: yup.string().trim(),
    }),
  }),

  update: yup.object({
    body: yup.object({
      name: yup.string().trim().required(),
      phones: yup.array().of(yup.string().phone()).required(),
      address: yup.string().trim(),
    }),
  }),

  makePayment: yup.object({
    params: yup.object({
      _id: yup
        .string()
        .test(
          "checkSupplier",
          "Supplier not found",
          async (v) => await Supplier.findOne({ _id: v })
        ),
    }),
    body: yup.object({
      date: yup.date().required(),
      paymentMethod: yup.string().trim().required(),
      amount: yup.number().min(1),
    }),
  }),

  removePayment: yup.object({
    params: yup.object({
      _id: yup
        .string()
        .test(
          "checkSupplier",
          "Supplier not found",
          async (v) => await Supplier.findOne({ _id: v })
        ),
    }),
  }),
};
