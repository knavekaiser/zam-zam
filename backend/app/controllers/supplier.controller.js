const {
  appConfig: { responseFn, responseStr },
} = require("../config");
const { ObjectId } = require("mongodb");
const { Supplier, Bill, SupplierPayment } = require("../models");
const { cdnHelper } = require("../helpers");

const joinPayments = [
  {
    $lookup: {
      from: "bills",
      let: {
        supplier: "$_id",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$supplier", "$$supplier"],
            },
          },
        },
        {
          $project: {
            adj: "$adjustment",
            totalItem: {
              $reduce: {
                input: "$items",
                initialValue: 0,
                in: {
                  $sum: [
                    "$$value",
                    {
                      $multiply: ["$$this.qty", "$$this.rate"],
                    },
                  ],
                },
              },
            },
            totalReturn: {
              $reduce: {
                input: "$returns",
                initialValue: 0,
                in: {
                  $sum: [
                    "$$value",
                    {
                      $multiply: ["$$this.qty", "$$this.rate"],
                    },
                  ],
                },
              },
            },
            totalCharge: {
              $reduce: {
                input: "$charges",
                initialValue: 0,
                in: {
                  $sum: ["$$value", "$$this.amount"],
                },
              },
            },
            totalPaid: {
              $reduce: {
                input: "$payments",
                initialValue: 0,
                in: {
                  $sum: ["$$value", "$$this.amount"],
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalPurchase: {
              $sum: {
                $sum: [
                  "$totalItem",
                  "$totalCharge",
                  "$adj",
                  {
                    $multiply: ["$totalReturn", -1],
                  },
                ],
              },
            },
            totalPaid: {
              $sum: "$totalPaid",
            },
            due: {
              $sum: {
                $subtract: [
                  {
                    $sum: [
                      "$totalItem",
                      "$totalCharge",
                      "$adj",
                      {
                        $multiply: ["$totalReturn", -1],
                      },
                    ],
                  },
                  "$totalPaid",
                ],
              },
            },
          },
        },
      ],
      as: "payment",
    },
  },
  {
    $unwind: {
      path: "$payment",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "supplierpayments",
      let: {
        supplier: "$_id",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$supplier", "$$supplier"],
            },
          },
        },
        {
          $group: {
            _id: null,
            amount: {
              $sum: "$amount",
            },
          },
        },
      ],
      as: "supplierPayment",
    },
  },
  {
    $set: {
      "payment.supplierPayment": {
        $getField: {
          input: {
            $first: "$supplierPayment",
          },
          field: "amount",
        },
      },
      "payment.due": {
        $subtract: [
          "$payment.due",
          {
            $ifNull: [
              {
                $getField: {
                  input: {
                    $first: "$supplierPayment",
                  },
                  field: "amount",
                },
              },
              0,
            ],
          },
        ],
      },
    },
  },
  { $unset: "supplierPayment" },
];

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
    const pipeline = [{ $match: conditions }, ...joinPayments];
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
    new Supplier(req.body)
      .save()
      .then(async (data) => {
        const supplier = await Supplier.aggregate([
          { $match: { _id: data._id } },
          ...joinPayments,
        ]);
        return responseFn.success(res, { data: supplier });
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
    Supplier.findOneAndUpdate({ _id: req.params._id }, req.body, { new: true })
      .then(async (data) => {
        const supplier = await Supplier.aggregate([
          { $match: { _id: data._id } },
          ...joinPayments,
        ]);
        return responseFn.success(
          res,
          { data: supplier },
          responseStr.record_updated
        );
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
    Supplier.deleteOne({ _id: req.params._id })
      .then(async (num) => {
        return responseFn.success(res, {}, responseStr.record_deleted);
      })
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.getPayments = async (req, res) => {
  try {
    const conditions = {};
    if (req.query.supplier) {
      conditions.supplier = ObjectId(req.query.supplier);
    }
    if (req.query.paymentMethods) {
      conditions.paymentMethod = { $in: req.query.paymentMethods.split(",") };
    }
    if (req.query.bills) {
      conditions.bills = { $all: req.query.bills.split(",") };
    }
    if (req.query.from_date && req.query.to_date) {
      conditions.date = {
        $gte: new Date(req.query.from_date),
        $lte: new Date(req.query.to_date),
      };
    }
    const pipeline = [{ $match: conditions }, ...joinPayments];
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
    SupplierPayment.aggregate(pipeline)
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

exports.makePayment = async (req, res) => {
  try {
    new SupplierPayment({
      ...req.body,
      supplier: req.params._id,
    })
      .save()
      .then(async (data) => {
        data = await SupplierPayment.findOne({ _id: data._id }).populate(
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

exports.updatePayment = async (req, res) => {
  try {
    const payment = await SupplierPayment.findOne({
      supplier: req.params._id,
      _id: req.params.paymentId,
    });
    const filesToDelete = [];
    if (req.body.documents) {
      payment.documents?.forEach((doc) => {
        if (!req.body.documents.find((d) => d.url === doc.url)) {
          filesToDelete.push(doc.url);
        }
      });
    }

    SupplierPayment.findOneAndUpdate({ _id: payment._id }, req.body, {
      new: true,
    })
      .then(async (data) => {
        data = await SupplierPayment.findOne({ _id: data._id }).populate(
          "supplier",
          "name phones address"
        );
        await cdnHelper.deleteFiles(filesToDelete);
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

exports.deletePayment = async (req, res) => {
  try {
    const payment = await SupplierPayment.findOne({
      supplier: req.params._id,
      _id: req.params.paymentId,
    });
    SupplierPayment.deleteOne({ _id: payment._id })
      .then(async (num) => {
        await cdnHelper.deleteFiles(payment.documents.map((doc) => doc.url));
        return responseFn.success(res, {}, responseStr.record_deleted);
      })
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.bulkBillPayment = async (req, res) => {
  try {
    const bills = await Bill.aggregate([
      {
        $match: {
          date: { $lte: new Date(req.body.date) },
          supplier: ObjectId(req.params._id),
        },
      },
      {
        $project: {
          date: "$date",
          adj: "$adjustment",
          totalItem: {
            $reduce: {
              input: "$items",
              initialValue: 0,
              in: {
                $sum: [
                  "$$value",
                  {
                    $multiply: ["$$this.qty", "$$this.rate"],
                  },
                ],
              },
            },
          },
          totalReturn: {
            $reduce: {
              input: "$returns",
              initialValue: 0,
              in: {
                $sum: [
                  "$$value",
                  {
                    $multiply: ["$$this.qty", "$$this.rate"],
                  },
                ],
              },
            },
          },
          totalCharge: {
            $reduce: {
              input: "$charges",
              initialValue: 0,
              in: {
                $sum: ["$$value", "$$this.amount"],
              },
            },
          },
          totalPaid: {
            $reduce: {
              input: "$payments",
              initialValue: 0,
              in: {
                $sum: ["$$value", "$$this.amount"],
              },
            },
          },
        },
      },
      {
        $addFields: {
          due: {
            $subtract: [
              {
                $sum: [
                  "$totalItem",
                  "$totalCharge",
                  "$adj",
                  { $multiply: ["$totalReturn", -1] },
                ],
              },
              "$totalPaid",
            ],
          },
        },
      },
      { $match: { due: { $gt: 0 } } },
      { $sort: { date: 1 } },
    ]);

    const totalDue = bills.reduce((p, c) => p + (c.due || 0), 0);
    if (req.body.amount > totalDue) {
      return responseFn.error(
        res,
        {},
        `Can't pay more than what's due. Current due: ${totalDue.toLocaleString(
          "en-IN"
        )}`
      );
    }

    const _id = ObjectId();
    let remaining = req.body.amount;
    const payments = [];
    bills.forEach((bill) => {
      if (remaining) {
        payments.push({
          _id,
          bill_id: bill._id,
          date: req.body.date,
          paymentMethod: req.body.paymentMethod,
          amount: Math.min(remaining, bill.due),
          documents: [],
        });
        remaining -= Math.min(remaining, bill.due);
      }
    });

    await Promise.all(
      payments.map(async ({ bill_id, ...payment }) =>
        Bill.findOneAndUpdate(
          { _id: bill_id },
          { $push: { payments: payment } }
        )
      )
    );

    const supplier = await Supplier.aggregate([
      { $match: { _id: ObjectId(req.params._id) } },
      ...joinPayments,
    ]);

    responseFn.success(res, { data: supplier[0] });
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
