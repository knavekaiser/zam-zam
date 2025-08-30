const {
  appConfig: { responseFn, responseStr },
} = require("../config");
const { firebase, cdnHelper } = require("../helpers");
const { Bill } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const conditions = {};
    if (req.query.members) {
      conditions.member = { $in: req.query.members.split(",") };
    }
    if (req.query.milestones) {
      conditions.milestone = { $in: req.query.milestones.split(",") };
    }
    if (req.query.from_date && req.query.to_date) {
      conditions.date = {
        $gte: new Date(req.query.from_date),
        $lte: new Date(req.query.to_date),
      };
    }

    const pipeline = [
      { $match: conditions },
      {
        $lookup: {
          from: "suppliers",
          localField: "supplier",
          foreignField: "_id",
          as: "supplier",
        },
      },
      { $unwind: "$supplier" },
      { $sort: { date: -1 } },
    ];

    const page = parseInt(req.query.page) || null;
    const pageSize = parseInt(req.query.pageSize) || null;
    if (page && pageSize) {
      pipeline.push({
        $facet: {
          records: [{ $skip: pageSize * (page - 1) }, { $limit: pageSize }],
          metadata: [{ $group: { _id: null, total: { $sum: 1 } } }],
        },
      });
    }

    Bill.aggregate(pipeline)
      .then((data) => {
        responseFn.success(
          res,
          page && pageSize
            ? {
                data: data[0].records,
                metadata: {
                  ...data[0].metadata[0],
                  _id: undefined,
                  page,
                  pageSize,
                },
              }
            : { data }
        );
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    new Bill({
      ...req.body,
    })
      .save()
      .then(async (data) => {
        data = await Bill.findOne({ _id: data._id }).populate(
          "supplier",
          "name phones address"
        );
        return responseFn.success(res, { data });
      })
      .catch((err) => {
        if (req.files?.length) {
          cdnHelper.deleteFiles(req.files.map((file) => file.key));
        }
        return responseFn.error(res, {}, err.message);
      });
  } catch (error) {
    if (req.files?.length) {
      cdnHelper.deleteFiles(req.files.map((file) => file.key));
    }
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params._id });

    const filesToDelete = [];
    if (req.body.documents) {
      bill.documents?.forEach((doc) => {
        if (!req.body.documents.find((d) => d.url === doc.url)) {
          filesToDelete.push(doc.url);
        }
      });
    }

    Bill.findOneAndUpdate({ _id: req.params._id }, req.body, { new: true })
      .populate("supplier", "name phones address")
      .then(async (data) => {
        await cdnHelper.deleteFiles(filesToDelete);
        return responseFn.success(res, { data }, responseStr.record_updated);
      })
      .catch((err) => {
        if (req.files?.length) {
          cdnHelper.deleteFiles(req.files.map((file) => file.key));
        }
        return responseFn.error(res, {}, err.message);
      });
  } catch (error) {
    if (req.files?.length) {
      cdnHelper.deleteFiles(req.files.map((file) => file.key));
    }
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.delete = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params._id });
    Bill.deleteOne({ _id: req.params._id })
      .then(async (num) => {
        await cdnHelper.deleteFiles([
          ...bill.documents.map((doc) => doc.url),
          ...bill.payments.map((p) => p.documents.map((d) => d.url)).flat(),
        ]);
        return responseFn.success(res, {}, responseStr.record_deleted);
      })
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.getBillItems = async (req, res) => {
  try {
    Bill.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
        },
      },
      { $match: { name: { $regex: req.query.name || "", $options: "i" } } },
    ])
      .then((data) => responseFn.success(res, { data }))
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
exports.getBillCharges = async (req, res) => {
  try {
    Bill.aggregate([
      { $unwind: "$charges" },
      {
        $group: {
          _id: "$charges.name",
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
        },
      },
      { $match: { name: { $regex: req.query.name || "", $options: "i" } } },
    ])
      .then((data) => responseFn.success(res, { data }))
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.addPayment = async (req, res) => {
  try {
    Bill.findOneAndUpdate(
      { _id: req.params._id },
      { $push: { payments: req.body } },
      { new: true }
    )
      .then(async (data) => {
        const payment = data.payments[data.payments.length - 1];
        return responseFn.success(res, { data: payment });
      })
      .catch((err) => {
        if (req.files?.length) {
          cdnHelper.deleteFiles(req.files.map((file) => file.key));
        }
        return responseFn.error(res, {}, err.message);
      });
  } catch (error) {
    if (req.files?.length) {
      cdnHelper.deleteFiles(req.files.map((file) => file.key));
    }
    return responseFn.error(res, {}, error.message, 500);
  }
};
exports.updatePayment = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params._id });
    const payment = bill.payments.find(
      (item) => item._id.toString() === req.params.paymentId
    );
    const filesToDelete = [];
    if (req.body.documents) {
      payment.documents?.forEach((doc) => {
        if (!req.body.documents.find((d) => d.url === doc.url)) {
          filesToDelete.push(doc.url);
        }
      });
    }
    const updates = { $set: {} };
    Object.entries(req.body).forEach(([k, v]) => {
      updates.$set[`payments.$.${k}`] = v;
    });
    Bill.findOneAndUpdate(
      {
        _id: bill._id,
        payments: { $elemMatch: { _id: payment._id } },
      },
      updates,
      { new: true }
    )
      .then(async (data) => {
        await cdnHelper.deleteFiles(filesToDelete);
        const payment = data.payments[data.payments.length - 1];
        return responseFn.success(res, { data: payment });
      })
      .catch((err) => {
        if (req.files?.length) {
          cdnHelper.deleteFiles(req.files.map((file) => file.key));
        }
        return responseFn.error(res, {}, err.message);
      });
  } catch (error) {
    if (req.files?.length) {
      cdnHelper.deleteFiles(req.files.map((file) => file.key));
    }
    return responseFn.error(res, {}, error.message, 500);
  }
};
exports.deletePayment = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params._id });
    const payment = bill.payments.find(
      (item) => item._id.toString() === req.params.paymentId
    );
    Bill.findOneAndUpdate(
      { _id: bill._id },
      { $pull: { payments: { _id: payment._id } } },
      { new: true }
    )
      .then(async (data) => {
        await cdnHelper.deleteFiles(payment.documents.map((item) => item.url));
        return responseFn.success(res, {});
      })
      .catch((err) => {
        return responseFn.error(res, {}, err.message);
      });
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
