const cron = require("node-cron");
const { firebase } = require(".");

const sendMilestoneReminder = async () => {
  const milestone = await Milestone.aggregate([
    {
      $match: {
        status: "ongoing",
      },
      // filter milestone that has 5 days left
    },
    { $set: { perMember: { $divide: ["$amount", totalShares] } } },
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
            $group: { _id: "$member", deposited: { $sum: "$amount" } },
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
          // filter member who has due
        ],
        as: "members",
      },
    },
  ]);

  firebase.notify({
    _ids: milestone.members.map((item) => item._id),
    message: {
      title: "Milestone Alert",
      body: `A Milestone is about to end in 5 days. Please complete the milestone before ${milestone.endDate.toDateString()}`,
    },
  });
};

cron.schedule(
  "0 10 * * *",
  () => {
    sendMilestoneReminder();
  },
  { scheduled: true, timezone: "Asia/Dhaka" }
);

const jobRunner = cron.schedule("* * * * *", () => {
  // runs every minute
  // get all jobs from db and run
});

const jobRunner_6_hour = cron.schedule("0 */6 * * *", () => {
  // runs every 6 hours

  backupDatabase();
});

const jobRunner_24_hour = cron.schedule("0 0 0 * * *", () => {
  // runs every 24 hours

  Session.update({ status: "expired" }, { where: { status: "active" } });
});
