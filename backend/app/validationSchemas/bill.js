const yup = require("yup");
const { Bill } = require("../models");

const body = {
  date: yup.date().required(),
  description: yup.string(),
  supplier: yup.string().required(),
  items: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(),
        qty: yup.number().required(),
        unit: yup.string().required(),
        rate: yup.number().required(),
      })
    )
    .min(1, "Please enter at least one item")
    .required(),
  charges: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(),
        amount: yup.number().required(),
      })
    )
    .required(),
};

module.exports = {
  create: yup.object({
    body: yup.object({
      ...body,
    }),
  }),

  update: yup.object({
    params: yup.object({
      _id: yup
        .string()
        .test(
          "billCheck",
          "Bill not found",
          async (v) => await Bill.findOne({ _id: v })
        ),
    }),
    body: yup.object({
      ...body,
    }),
  }),

  addPayment: yup.object({
    params: yup.object({
      _id: yup
        .string()
        .test(
          "billCheck",
          "Bill not found",
          async (v) => await Bill.findOne({ _id: v })
        ),
    }),
    body: yup.object({
      date: yup.string().required(),
      amount: yup.string().required(),
      paymentMethod: yup.string().required(),
    }),
  }),
  updatePayment: yup.object({
    params: yup.object({
      _id: yup.string(),
      paymentId: yup
        .string()
        .test("billCheck", "Bill not found", async function (v) {
          const { createError } = this;
          const bill = await Bill.findOne({ _id: this.parent._id });
          if (!bill) {
            return createError({
              path: "params._id",
              message: "Bill not found",
            });
          }
          const payment = bill.payments.find(
            (payment) => payment._id.toString() === v
          );
          if (!payment) {
            return createError({
              path: "params.paymentId",
              message: "Payment not found",
            });
          }
          return true;
        }),
    }),
    body: yup.object({
      date: yup.string().required(),
      amount: yup.string().required(),
      paymentMethod: yup.string().required(),
    }),
  }),
  deletePayment: yup.object({
    params: yup.object({
      _id: yup.string(),
      paymentId: yup
        .string()
        .test("billCheck", "Bill not found", async function (v) {
          const { createError } = this;
          const bill = await Bill.findOne({ _id: this.parent._id });
          if (!bill) {
            return createError({
              path: "params._id",
              message: "Bill not found",
            });
          }
          const payment = bill.payments.find(
            (payment) => payment._id.toString() === v
          );
          if (!payment) {
            return createError({
              path: "params.paymentId",
              message: "Payment not found",
            });
          }
          return true;
        }),
    }),
    body: yup.object({}),
  }),
};
