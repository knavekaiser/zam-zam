const {
  appConfig: { responseFn, responseStr },
} = require("../config");

const { Supplier } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const conditions = {};
    if (req.query.name) {
      conditions.name = { $regex: req.query.name, $options: "i" };
    }
    if (req.query.from_date && req.query.to_date) {
      conditions.date = {
        $gte: new Date(req.query.from_date),
        $lte: new Date(req.query.to_date),
      };
    }
    const pipeline = [{ $match: conditions }];
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
    Supplier.aggregate(pipeline)
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
    new Supplier({
      ...req.body,
      status: "pending-approval",
      timeline: [
        {
          action: "Created",
          staff: req.authUser._id,
          dateTime: new Date(),
        },
      ],
    })
      .save()
      .then(async (data) => {
        return responseFn.success(res, { data });
      })
      .catch((err) => {
        return responseFn.error(res, {}, err.message);
      });
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    ["timeline"].forEach((item) => {
      delete req.body[item];
    });
    const deposit = await Supplier.findOne({ _id: req.params._id });

    const filesToDelete = [];
    if (req.body.documents) {
      deposit.documents?.forEach((doc) => {
        if (!req.body.documents.find((d) => d.url === doc.url)) {
          filesToDelete.push(doc.url);
        }
      });
    }

    Supplier.findOneAndUpdate(
      { _id: req.params._id },
      {
        ...req.body,
        $push: {
          timeline: {
            $each: [
              {
                action: "Updated",
                staff: req.authUser._id,
                dateTime: new Date(),
              },
            ],
          },
        },
      },
      { new: true }
    )
      .then(async (data) => {
        return responseFn.success(res, { data }, responseStr.record_updated);
      })
      .catch((err) => {
        return responseFn.error(res, {}, err.message);
      });
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.delete = async (req, res) => {
  try {
    Supplier.findOneAndUpdate(
      { _id: req.params._id },
      {
        status: "deleted",
        $push: {
          timeline: {
            $each: [
              {
                action: "Deleted",
                staff: req.authUser._id,
                dateTime: new Date(),
              },
            ],
          },
        },
      }
    )
      .then(async (num) => {
        return responseFn.success(res, {}, responseStr.record_deleted);
      })
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
