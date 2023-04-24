const cron = require("node-cron");
const firebase = require("./firebase.helper");
const { Milestone, Member } = require("../models");

const sendMilestoneReminder = async () => {
  const totalShares = await Member.count({ status: "active" });
  const milestone = await Milestone.aggregate([
    [
      {
        $match: {
          status: "ongoing",
          $expr: {
            $eq: [
              {
                $dateFromParts: {
                  year: new Date().getFullYear(),
                  month: new Date().getMonth() + 1,
                  day: new Date().getDate(),
                },
              },
              {
                $dateSubtract: {
                  startDate: "$endDate",
                  unit: "day",
                  amount: 5,
                },
              },
            ],
          },
        },
      },
      { $set: { perMember: { $divide: ["$amount", totalShares] } } },
      {
        $lookup: {
          from: "members",
          let: { id: "$_id", perMember: "$perMember" },
          pipeline: [
            {
              $lookup: {
                from: "deposits",
                let: { milestone_id: "$$id", member_id: "$_id" },
                as: "deposited",
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$$member_id", "$member"] },
                          { $eq: ["$$milestone_id", "$milestone"] },
                          { $eq: ["$status", "approved"] },
                        ],
                      },
                    },
                  },
                  { $group: { _id: null, deposited: { $sum: "$amount" } } },
                ],
              },
            },
            {
              $set: {
                deposited: { $max: [{ $first: "$deposited.deposited" }, 0] },
              },
            },
            {
              $project: {
                name: "$name",
                email: "$email",
                phone: "$phone",
                status: "$status",
                deposited: "$deposited",
                due: { $subtract: ["$$perMember", "$deposited"] },
              },
            },
            { $match: { due: { $gt: 0 } } },
          ],
          as: "members",
        },
      },
    ],
  ]);

  if (milestone.length > 0) {
    firebase.notify({
      _ids: milestone[0].members.map((item) => item._id),
      // _ids: milestone.reduce(
      //   (p, c) => [...p, c.members.map((item) => item._id)],
      //   []
      // ),
      message: {
        title: "Milestone Alert",
        body: `A Milestone is about to end in 5 days. Please complete the milestone before ${milestone[0].endDate.toDateString()}`,
      },
    });
  }
};

cron.schedule(
  "0 10 * * *",
  () => {
    sendMilestoneReminder();
  },
  { scheduled: true, timezone: "Asia/Dhaka" }
);

const updateOlderMilestones = async () => {
  Milestone.updateMany(
    { status: "upcoming", startDate: { $lte: new Date() } },
    { status: "ongoing" }
  );
  Milestone.aggregate([
    { $match: { status: "ongoing", endDate: { $lt: new Date() } } },
    {
      $lookup: {
        from: "deposits",
        let: { id: "$_id" },
        as: "deposit",
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
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ],
      },
    },
    { $set: { deposit: { $first: "$deposit.total" } } },
    {
      $set: {
        status: {
          $cond: {
            if: { $gt: ["$amount", "$deposit"] },
            then: "past-due",
            else: "complete",
          },
        },
      },
    },
  ])
    .then(async (data) => {
      for (let i = 0; i < data.length; i++) {
        const milestone = data[i];
        await Milestone.updateOne(
          { _id: milestone._id },
          { status: milestone.status }
        );
      }
    })
    .catch((err) => console.log(err));
};

// const jobRunner = cron.schedule("* * * * *", () => {
// runs every minute
// get all jobs from db and run
// });

// const jobRunner_6_hour = cron.schedule("0 */6 * * *", () => {
//   // runs every 6 hours
// });

const jobRunner_24_hour = cron.schedule(
  "0 0 0 * * *",
  () => {
    updateOlderMilestones();
  },
  { scheduled: true, timezone: "Asia/Dhaka" }
);
