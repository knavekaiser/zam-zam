const {
  appConfig: { responseFn, responseStr },
} = require("../config");
const { firebase } = require("../helpers");

const { Expense } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const conditions = {};
    if (req.authToken.userType === "staff") {
      const allowedStatus = ["approved"];
      if (req.authUser.role.permissions.includes("expense_delete")) {
        allowedStatus.push("pending-delete");
      }
      if (
        ["expense_create", "expense_update", "expense_approve"].some((item) =>
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
    if (req.query.from_date && req.query.to_date) {
      conditions.date = {
        $gte: new Date(req.query.from_date),
        $lte: new Date(req.query.to_date),
      };
    }
    Expense.aggregate([
      { $match: conditions },
      { $sort: { date: -1 } },
      { $project: { __v: 0 } },
    ])
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
    new Expense({
      ...req.body,
      addedBy: req.authUser._id,
      status: "pending-approval",
    })
      .save()
      .then(async (data) => {
        await firebase.notifyStaffs("Cashier", {
          tokens,
          message: {
            title: "Expense Added",
            body: `New Expense has been added. Approve or Disapprove`,
            click_action: `${process.env.SITE_URL}/expenses`,
          },
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
    ["addedBy", "approvedBy", "status"].forEach((item) => {
      delete req.body[item];
    });
    Expense.findOneAndUpdate(
      { _id: req.params._id },
      { ...req.body, status: "pending-update" },
      { new: true }
    )
      .then(async (data) => {
        await firebase.notifyStaffs("Cashier", {
          tokens,
          message: {
            title: "Expense Updated",
            body: `New Expense has been updated. Approve or Disapprove`,
            click_action: `${process.env.SITE_URL}/expenses`,
          },
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
    Expense.findOneAndUpdate(
      { _id: req.params._id },
      { status: "approved" },
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

exports.reqDelete = async (req, res) => {
  try {
    Expense.findOneAndUpdate(
      { _id: req.params._id },
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
    Expense.findOneAndUpdate(
      { _id: req.params._id, status: "pending-delete" },
      { status: "deleted" }
    )
      .then((num) => responseFn.success(res, {}, responseStr.record_deleted))
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
