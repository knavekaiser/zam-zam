const {
  appConfig: { responseFn, responseStr },
} = require("../config");

const { Deposit, Expense, Withdrawal } = require("../models");

exports.dashboardData = async (req, res) => {
  try {
    // data
    const conditions = {
      status: "approved",
    };
    const [
      [{ amount: totalDeposit }],
      [{ amount: totalExpense }],
      [{ amount: totalWithdrawal }],
    ] = await Promise.all([
      Deposit.aggregate([
        { $match: conditions },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: conditions },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      Withdrawal.aggregate([
        { $match: conditions },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
    ]).catch((err) => responseFn.error(res, {}, err.message));

    return responseFn.success(res, {
      data: {
        totalDeposit,
        totalExpense,
        totalWithdrawal,
        currentBalance: totalDeposit - (totalExpense + totalWithdrawal),
      },
    });
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
