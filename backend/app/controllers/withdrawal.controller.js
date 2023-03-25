const {
  appConfig: { responseFn, responseStr, smsTemplate },
} = require("../config");

const { Withdrawal } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const conditions = {};
    if (req.authToken.userType === "staff") {
      const allowedStatus = ["approved"];
      if (req.authUser.role.permissions.includes("withdrawal_delete")) {
        allowedStatus.push("pending-delete");
      }
      if (
        ["withdrawal_create", "withdrawal_update", "withdrawal_approve"].some(
          (item) => req.authUser.role.permissions?.includes(item)
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
    if (req.query.from_date && req.query.to_date) {
      conditions.date = {
        $gte: new Date(req.query.from_date),
        $lte: new Date(req.query.to_date),
      };
    }
    Withdrawal.find(conditions)
      .populate("member", "name email photo phone")
      .sort("-date")
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
    new Withdrawal({
      ...req.body,
      addedBy: req.authUser.id,
      status: "pending-approval",
    })
      .save()
      .then(async (data) => {
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
    Withdrawal.findOneAndUpdate(
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
    Withdrawal.findOneAndUpdate(
      { _id: req.params.id },
      { status: "approved" },
      { new: true }
    )
      .populate("member", "name email photo phone")
      .then((data) => {
        if (data) {
          if (data.member) {
            smsHelper.sendSms({
              to: data.member.phone,
              message: smsTemplate.money_withdrawed
                .replace("{name}", data.member.name)
                .replace("{amount}", data.amount.toLocaleString("bn-BD")),
            });
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
    Withdrawal.findOneAndUpdate(
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
    Withdrawal.findOneAndUpdate(
      { _id: req.params.id, status: "pending-delete" },
      { status: "deleted" }
    )
      .then((num) => responseFn.success(res, {}, responseStr.record_deleted))
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
