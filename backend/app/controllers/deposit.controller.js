const {
  appConfig: { responseFn, responseStr, smsTemplate },
} = require("../config");
const { smsHelper, firebase } = require("../helpers");

const { Deposit, Milestone } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const conditions = {};
    if (req.authToken.userType === "staff") {
      const allowedStatus = ["approved"];
      if (req.authUser.role.permissions.includes("deposit_delete")) {
        allowedStatus.push("pending-delete");
      }
      if (
        ["deposit_create", "deposit_update", "deposit_approve"].some((item) =>
          req.authUser.role.permissions?.includes(item)
        )
      ) {
        allowedStatus.push("pending-approval");
      }
      const filterStatus = req.query.status?.split(",") || null;
      if (
        req.authUser.role.name === "Manager" &&
        filterStatus?.includes("deleted")
      ) {
        allowedStatus.push("deleted");
      }
      conditions.status = {
        $in: filterStatus
          ? allowedStatus.filter((s) => filterStatus.some((i) => i === s))
          : allowedStatus,
      };
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
      .populate("timeline.staff", "name email photo phone")
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
      status: "pending-approval",
      timeline: [
        {
          action: "Created",
          staff: req.authUser._id,
          dateTime: new Date(),
        },
      ],
    })
      .save()
      .then(async (data) => {
        data = await Deposit.findOne({ _id: data._id })
          .populate("member", "name email photo phone")
          .populate("timeline.staff", "name email photo phone");
        await firebase.notifyStaffs("Cashier", {
          title: "Money Deposited",
          body: `New Deposit from ${data.member.name} (${data.member.phone}). Approve or Disapprove`,
          click_action: `${process.env.SITE_URL}/deposits`,
        });
        return responseFn.success(res, { data });
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    ["timeline"].forEach((item) => {
      delete req.body[item];
    });
    const deposit = await Deposit.findOne({ _id: req.params._id });
    Deposit.findOneAndUpdate(
      { _id: req.params._id },
      {
        ...req.body,
        status: "pending-update",
        $push: {
          timeline: {
            $each: [
              {
                action:
                  deposit.status === "pending-update"
                    ? "Update Approved"
                    : "Updated",
                staff: req.authUser._id,
                dateTime: new Date(),
              },
            ],
          },
        },
      },
      { new: true }
    )
      .populate("member", "name email photo phone")
      .populate("timeline.staff", "name email photo phone")
      .then(async (data) => {
        await firebase.notifyStaffs("Cashier", {
          title: "Deposit Updated",
          body: `A Deposit has been updated. Approve or Disapprove`,
          click_action: `${process.env.SITE_URL}/deposits`,
        });
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
      { _id: req.params._id },
      {
        status: "approved",
        $push: {
          timeline: {
            $each: [
              {
                action: "Approved",
                staff: req.authUser._id,
                dateTime: new Date(),
              },
            ],
          },
        },
      },
      { new: true }
    )
      .populate("member", "name email photo phone")
      .populate("milestone", "title startDate endDate amount status")
      .populate("timeline.staff", "name email photo phone")
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
      { _id: req.params._id },
      {
        status: "pending-delete",
        $push: {
          timeline: {
            $each: [
              {
                action: "Delete Requested",
                staff: req.authUser._id,
                dateTime: new Date(),
              },
            ],
          },
        },
      }
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
      {
        _id: req.params._id,
        status: "pending-delete",
      },
      {
        status: "deleted",
        $push: {
          timeline: {
            $each: [
              {
                action: "Deleted",
                staff: req.authUser._id,
                dateTime: new Date(),
              },
            ],
          },
        },
      }
    )
      .then((num) => responseFn.success(res, {}, responseStr.record_deleted))
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
