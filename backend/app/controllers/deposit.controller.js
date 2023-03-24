const {
  appConfig: { responseFn, responseStr, smsTemplate },
} = require("../config");
const { smsHelper } = require("../helpers");

const { Deposit, Milestone } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const conditions = {
      // add filters here,
    };
    if (req.authToken.userType === "staff") {
      if (req.query.status) {
        conditions.status = { $in: req.query.status.split(",") };
      }
    } else {
      conditions.status = "approved";
    }
    if (req.query.members) {
      conditions.member = { $in: req.query.members.split(",") };
    }
    if (req.query.milestones) {
      conditions.milestone = { $in: req.query.milestones.split(",") };
    }
    if (req.query.from_date && req.query.to_date) {
      conditions.date = {
        $gte: new Date(req.query.from_date),
        $lte: new Date(req.query.to_date),
      };
    }
    Deposit.find(conditions)
      .sort("-date")
      .populate("member", "name email photo phone")
      .then((data) => {
        responseFn.success(res, { data });
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    new Deposit({
      ...req.body,
      addedBy: req.authUser.id,
      status: "pending-approval",
    })
      .save()
      .then(async (data) => {
        data = await Deposit.findOne({ _id: data.id }).populate(
          "member",
          "name email photo phone"
        );
        return responseFn.success(res, { data });
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    ["addedBy", "approvedBy", "status"].forEach((item) => {
      delete req.body[item];
    });
    Deposit.findOneAndUpdate(
      { _id: req.params.id },
      { ...req.body, status: "pending-update" },
      { new: true }
    )
      .then((data) => {
        return responseFn.success(res, { data }, responseStr.record_updated);
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.approve = async (req, res) => {
  try {
    Deposit.findOneAndUpdate(
      { _id: req.params.id },
      { status: "approved" },
      { new: true }
    )
      .populate("member", "name email photo phone")
      .populate("milestone", "title startDate endDate amount status")
      .then(async (data) => {
        if (data) {
          if (data.member) {
            smsHelper.sendSms({
              to: data.member.phone,
              message: smsTemplate.money_deposited
                .replace("{name}", data.member.name)
                .replace("{amount}", data.amount.toLocaleString("bn-BD")),
            });
          }
          if (data.milestone) {
            const totalDeposit = await Deposit.aggregate([
              { $match: { status: "approved", milestone: data.milestone._id } },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ]).then((data) => data[0]?.total || 0);
            if (totalDeposit >= data.milestone.amount) {
              data.milestone = await Milestone.findOneAndUpdate(
                { _id: data.milestone._id },
                { status: "complete" },
                { new: true }
              ).then((data) => ({
                title: data.title,
                startDate: data.startDate,
                endDate: data.endDate,
                amount: data.amount,
              }));
            }
          }
          return responseFn.success(res, { data }, responseStr.record_updated);
        }
        return responseFn.error(res, {}, responseStr.record_not_found);
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.reqDelete = async (req, res) => {
  try {
    Deposit.findOneAndUpdate(
      { _id: req.params.id },
      { status: "pending-delete" }
    )
      .then((num) => responseFn.success(res, {}, responseStr.delete_requested))
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.delete = async (req, res) => {
  try {
    Deposit.findOneAndUpdate(
      { _id: req.params.id, status: "pending-delete" },
      { status: "deleted" }
    )
      .then((num) => responseFn.success(res, {}, responseStr.record_deleted))
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
