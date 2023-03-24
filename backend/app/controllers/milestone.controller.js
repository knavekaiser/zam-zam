const {
  appConfig: { responseFn, responseStr, smsTemplate },
} = require("../config");

const { Milestone } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const conditions = {};
    if ("name" in req.query) {
      conditions.name = {
        $regex: req.query.name,
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
    Milestone.aggregate([
      { $match: conditions },
      {
        $lookup: {
          from: "deposits",
          let: { id: "$_id" },
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
          ],
          as: "deposited",
        },
      },
      { $unwind: { path: "$deposited", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          description: { $first: "$description" },
          amount: { $first: "$amount" },
          startDate: { $first: "$startDate" },
          endDate: { $first: "$endDate" },
          status: { $first: "$status" },
          deposited: {
            $sum: "$deposited.amount",
          },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
      { $sort: { startDate: -1 } },
    ])
      // .sort("date")
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
      { _id: req.params.id },
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
    Milestone.findOneAndUpdate({ _id: req.params.id }, { status: "deleted" })
      .then((num) => responseFn.success(res, {}, responseStr.record_deleted))
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
