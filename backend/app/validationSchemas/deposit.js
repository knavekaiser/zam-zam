const yup = require("yup");
const { Member, Milestone } = require("../models");

module.exports = {
  create: yup.object({
    body: yup.object({
      member: yup
        .string()
        .objectId()
        .required()
        .test(
          "memberCheck",
          "Member not found",
          async (v) => await Member.findOne({ _id: v, status: "active" })
        ),
      milestone: yup
        .string()
        .objectId()
        .required()
        .test(
          "milestoneCheck",
          "Milestone not found",
          async (v) =>
            await Milestone.findOne({
              _id: v,
              status: { $in: ["ongoing", "past-due"] },
            })
        ),
      date: yup.date().required(),
      amount: yup.number().min(1, "Amount can't be less that 1").required(),
      remark: yup.string(),
    }),
  }),

  update: yup.object({
    body: yup.object({
      member: yup
        .string()
        .objectId()
        .required()
        .test(
          "memberCheck",
          "Member not found",
          async (v) => await Member.findOne({ _id: v, status: "active" })
        ),
      milestone: yup
        .string()
        .objectId()
        .required()
        .test(
          "milestoneCheck",
          "Milestone not found",
          async (v) =>
            await Milestone.findOne({
              _id: v,
              status: { $in: ["ongoing", "past-due"] },
            })
        ),
      date: yup.date().required(),
      amount: yup.number().min(1, "Amount can't be less that 1").required(),
      remark: yup.string(),
    }),
  }),
};
