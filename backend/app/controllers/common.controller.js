const {
  appConfig: { responseFn, responseStr },
} = require("../config");
const { appHelper } = require("../helpers");

const {
  Deposit,
  Expense,
  Withdrawal,
  Device,
  Milestone,
  Member,
  BugReport,
} = require("../models");

exports.dashboardData = async (req, res) => {
  try {
    const permissions = req.authUser.role?.permissions || [];
    const viewDeposits = permissions.includes("deposit_read");
    const viewExpenses = permissions.includes("expense_read");
    const viewWithdrawals = permissions.includes("withdrawal_read");

    const conditions = { status: "approved" };
    const expenseCondition = { status: "approved" };

    if (req.authToken.userType === "member" && req.query.selfOnly === "true") {
      conditions.member = req.authUser._id;
    }

    const totalShares = await Member.count({ status: "active" });
    const pipeline = [
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
      {
        $group: {
          _id: "$_id.year",
          data: {
            $push: {
              x: {
                $dateToString: {
                  format: "%Y-%m",
                  date: {
                    $dateFromParts: {
                      year: "$_id.year",
                      month: "$_id.month",
                    },
                  },
                },
              },
              y: "$total",
            },
          },
        },
      },
    ];
    const processData = (data) =>
      data.reduce(
        (p, c) => {
          p.eachMonth = [
            ...Array(12).fill(null),
            ...c.data.map((item) => item.y),
          ].splice(-12);

          p.total = c.data.reduce((sum, item) => sum + item.y, 0);

          return p;
        },
        { total: 0, eachMonth: [] }
      );
    const [deposits, expenses, withdrawals, currentBalance, milestones = []] =
      await Promise.all([
        Deposit.aggregate([{ $match: conditions }, ...pipeline]).then((data) =>
          processData(data)
        ),
        Expense.aggregate([{ $match: expenseCondition }, ...pipeline]).then(
          (data) => processData(data)
        ),
        Withdrawal.aggregate([{ $match: conditions }, ...pipeline]).then(
          (data) => processData(data)
        ),

        Promise.all([
          Deposit.aggregate([
            { $match: { status: "approved" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          Expense.aggregate([
            { $match: { status: "approved" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          Withdrawal.aggregate([
            { $match: { status: "approved" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
        ]).then(([[deposit], [expense], [withdrawal]]) =>
          viewDeposits && (viewWithdrawals || viewExpenses)
            ? +(
                (deposit?.total || 0) -
                ((viewExpenses ? expense?.total || 0 : 0) +
                  (viewWithdrawals ? withdrawal?.total || 0 : 0))
              ).toFixed(2)
            : undefined
        ),

        // req.authToken.userType === "member"
        Milestone.aggregate([
          { $match: { status: { $in: ["past-due", "ongoing"] } } },
          { $set: { perMember: { $divide: ["$amount", totalShares] } } },
          ...(req.authToken.userType === "member"
            ? [
                {
                  $lookup: {
                    from: "deposits",
                    let: { id: "$_id", perMember: "$perMember" },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$$id", "$milestone"] },
                              { $eq: ["$status", "approved"] },
                              { $eq: ["$member", req.authUser._id] },
                            ],
                          },
                        },
                      },
                      {
                        $group: {
                          _id: "$member",
                          deposited: { $sum: "$amount" },
                        },
                      },
                      {
                        $lookup: {
                          from: "members",
                          localField: "_id",
                          foreignField: "_id",
                          as: "member",
                        },
                      },
                      { $unwind: "$member" },
                      {
                        $project: {
                          name: "$member.name",
                          email: "$member.email",
                          phone: "$member.phone",
                          status: "$member.status",
                          deposited: "$deposited",
                          due: { $subtract: ["$$perMember", "$deposited"] },
                        },
                      },
                    ],
                    as: "deposits",
                  },
                },
                {
                  $set: {
                    myDeposit: { $sum: "$deposits.deposited" },
                    myDue: {
                      $subtract: [
                        "$perMember",
                        { $sum: "$deposits.deposited" },
                      ],
                    },
                  },
                },
              ]
            : []),
          {
            $lookup: {
              from: "deposits",
              let: { id: "$_id", perMember: "$perMember" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$$id", "$milestone"] },
                        { $eq: ["$status", "approved"] },
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: "$member",
                    deposited: { $sum: "$amount" },
                  },
                },
                {
                  $lookup: {
                    from: "members",
                    localField: "_id",
                    foreignField: "_id",
                    as: "member",
                  },
                },
                { $unwind: "$member" },
                {
                  $project: {
                    name: "$member.name",
                    email: "$member.email",
                    phone: "$member.phone",
                    status: "$member.status",
                    deposited: "$deposited",
                    due: { $subtract: ["$$perMember", "$deposited"] },
                  },
                },
              ],
              as: "totalDeposits",
            },
          },
          {
            $set: {
              totalDeposited: { $sum: "$totalDeposits.deposited" },
              totalDue: {
                $subtract: ["$amount", { $sum: "$totalDeposits.deposited" }],
              },
            },
          },
          // filter only my due
          {
            $project: {
              title: 1,
              description: 1,
              startDate: 1,
              endDate: 1,
              amount: 1,
              totalDeposited: 1,
              totalDue: 1,
              myDeposit: 1,
              myDue: 1,
              perMember: 1,
              status: 1,
            },
          },
          { $sort: { startDate: 1 } },
        ]),
      ]);

    return responseFn.success(res, {
      data: {
        monthLabels: appHelper.getPast12Months(),
        deposits: viewDeposits ? deposits : undefined,
        expenses: viewExpenses ? expenses : undefined,
        withdrawals: viewWithdrawals ? withdrawals : undefined,

        currentBalance,

        milestones: milestones.map((item) => ({
          ...item,
          ...(req.authToken.userType === "member" && {
            myDue: +item.myDue.toFixed(2),
            myDeposit: +item.myDeposit.toFixed(2),
          }),
          perMember: +item.perMember.toFixed(2),
        })),
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

exports.autoBugReport = async (req, res) => {
  try {
    new BugReport({ ...req.body })
      .save()
      .then(() => responseFn.success(res, {}, responseStr.success))
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (err) {
    responseFn.error(res, {}, err.message);
  }
};
