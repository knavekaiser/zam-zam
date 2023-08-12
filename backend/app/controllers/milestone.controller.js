const {
  appConfig: { responseFn, responseStr, smsTemplate },
} = require("../config");
const { firebase, smsHelper } = require("../helpers");

const { Milestone, Member } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const conditions = {};
    if ("title" in req.query) {
      conditions.title = {
        $regex: req.query.title,
        $options: "i",
      };
    }
    if (req.query.status) {
      conditions.status = { $in: req.query.status.split(",") };
    }

    if (req.query.from_date && req.query.to_date) {
      conditions.date = {
        $gte: new Date(req.query.from_date),
        $lte: new Date(req.query.to_date),
      };
    }
    const totalShares = await Member.count({ status: "active" });
    Milestone.aggregate([
      { $match: conditions },
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
            { $group: { _id: "$member", deposited: { $sum: "$amount" } } },
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
          totalDeposited: { $sum: "$deposits.deposited" },
          totalDue: { $subtract: ["$amount", { $sum: "$deposits.deposited" }] },
        },
      },
      { $sort: { startDate: -1 } },
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
    let status = "upcoming";
    if (new Date(req.body.startDate) > new Date()) {
      status = "upcoming";
    } else if (new Date(req.body.endDate) < new Date()) {
      status = "past-due";
    } else if (
      new Date(req.body.startDate) < new Date() &&
      new Date(req.body.endDate) > new Date()
    ) {
      status = "ongoing";
    }
    new Milestone({
      ...req.body,
      addedBy: req.authUser.id,
      status,
    })
      .save()
      .then(async (data) => {
        const numbers = await Member.find({}, "phone").then((data) =>
          data.map((item) => item.phone)
        );
        await smsHelper.sendSms({
          to: numbers,
          message: smsTemplate.milestone_creation
            .replace("{amount}", "৳" + (data.amount / 32).toLocaleString("bn"))
            .replace("{date}", new Date(data.endDate).formatBN()),
        });
        if (data.status === "ongoing") {
          await firebase.notifyMembers(null, {
            title: "New Milestone",
            body: `New Milestone has been created. Please complete the milestone before ${data.endDate.toDateString()}`,
            click_action: `${process.env.SITE_URL}`,
          });
        }
        return responseFn.success(res, { data });
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    ["addedBy", "status"].forEach((item) => {
      delete req.body[item];
    });
    Milestone.findOneAndUpdate(
      { _id: req.params._id },
      { ...req.body },
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

exports.delete = async (req, res) => {
  try {
    Milestone.findOneAndUpdate({ _id: req.params._id }, { status: "deleted" })
      .then((num) => responseFn.success(res, {}, responseStr.record_deleted))
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
