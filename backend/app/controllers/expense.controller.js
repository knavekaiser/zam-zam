const {
  appConfig: { responseFn, responseStr },
} = require("../config");

const { Expense } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const conditions = {
      // add filters here,
    };
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
    Expense.findOneAndUpdate(
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
    Expense.findOneAndUpdate(
      { _id: req.params.id },
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
    Expense.findOneAndUpdate(
      { _id: req.params.id, status: "pending-delete" },
      { status: "deleted" }
    )
      .then((num) => responseFn.success(res, {}, responseStr.record_deleted))
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
