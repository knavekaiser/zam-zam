const {
  appConfig: { responseFn, responseStr },
} = require("../config");
const { firebase } = require("../helpers");

const { Deposit, Expense, Withdrawal, Device } = require("../models");

exports.dashboardData = async (req, res) => {
  try {
    const permissions = req.authUser.role?.permissions || [];

    const conditions = { status: "approved" };

    const [totalDeposit = 0, totalExpense = 0, totalWithdrawal = 0] =
      await Promise.all([
        Deposit.aggregate([
          { $match: conditions },
          { $group: { _id: null, amount: { $sum: "$amount" } } },
        ]).then((data) => data[0]?.amount),
        Expense.aggregate([
          { $match: conditions },
          { $group: { _id: null, amount: { $sum: "$amount" } } },
        ]).then((data) => data[0]?.amount),
        Withdrawal.aggregate([
          { $match: conditions },
          { $group: { _id: null, amount: { $sum: "$amount" } } },
        ]).then((data) => data[0]?.amount),
      ]).catch((err) => responseFn.error(res, {}, err.message));

    return responseFn.success(res, {
      data: {
        totalDeposit: permissions.includes("deposit_read")
          ? totalDeposit
          : undefined,
        totalExpense: permissions.includes("expense_read")
          ? totalExpense
          : undefined,
        totalWithdrawal: permissions.includes("withdrawal_read")
          ? totalWithdrawal
          : undefined,
        currentBalance:
          permissions.includes("deposit_read") &&
          (permissions.includes("withdrawal_read") ||
            permissions.includes("expense_read"))
            ? totalDeposit -
              ((permissions.includes("expense_read") ? totalExpense : 0) +
                (permissions.includes("withdrawal_read") ? totalWithdrawal : 0))
            : undefined,
      },
    });
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.addDevice = async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.body.deviceId });

    // validate somehow
    //   const result = await firebase.validateToken(req.body.fcmToken);

    if (device) {
      delete req.body.deviceId;
      await Device.findOneAndUpdate({ _id: device._id }, req.body);
    } else {
      await new Device(req.body).save().catch((err) => console.log(err));
    }
    responseFn.success(res, {}, responseStr.success);
  } catch (err) {
    console.log(err);
    responseFn.error(res, {}, err.message);
  }
};
