const {
  appConfig: { responseFn, responseStr, smsTemplate },
} = require("../config");
const { firebase, smsHelper, cdnHelper } = require("../helpers");

const { Withdrawal } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const conditions = {};
    if (req.authToken.userType === "staff") {
      const allowedStatus = ["approved"];
      if (req.authUser.role.permissions.includes("withdrawal_delete")) {
        allowedStatus.push("pending-delete");
      }
      if (
        ["withdrawal_create", "withdrawal_update", "withdrawal_approve"].some(
          (item) => req.authUser.role.permissions?.includes(item)
        )
      ) {
        allowedStatus.push("pending-approval");
      }
      const filterStatus = req.query.status?.split(",") || null;
      if (
        req.authUser.role.name === "Manager" &&
        filterStatus?.includes("deleted")
      ) {
        allowedStatus.push("deleted");
      }
      conditions.status = {
        $in: filterStatus
          ? allowedStatus.filter((s) => filterStatus.some((i) => i === s))
          : allowedStatus,
      };
    } else {
      conditions.status = "approved";
    }
    if (req.query.members) {
      conditions.member = { $in: req.query.members.split(",") };
    }
    if (req.query.from_date && req.query.to_date) {
      conditions.date = {
        $gte: new Date(req.query.from_date),
        $lte: new Date(req.query.to_date),
      };
    }
    Withdrawal.find(conditions)
      .populate("member", "name email photo phone")
      .populate("timeline.staff", "name email photo phone")
      .sort("-date")
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
    new Withdrawal({
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
        data = await Withdrawal.findOne({ _id: data._id })
          .populate("member", "name email photo phone")
          .populate("timeline.staff", "name email photo phone");
        await firebase.notifyStaffs("Cashier", {
          title: "Withdrawal Added",
          body: `New Withdrawal added. Approve or Disapprove`,
          click_action: `${process.env.SITE_URL}/withdrawals`,
        });
        return responseFn.success(res, { data });
      })
      .catch((err) => {
        if (req.files?.length) {
          cdnHelper.deleteFiles(req.files.map((file) => file.path));
        }
        return responseFn.error(res, {}, err.message);
      });
  } catch (error) {
    if (req.files?.length) {
      cdnHelper.deleteFiles(req.files.map((file) => file.path));
    }
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    ["timeline"].forEach((item) => {
      delete req.body[item];
    });
    const withdrawal = await Withdrawal.findOne({ _id: req.params._id });

    const filesToDelete = [];
    if (req.body.documents) {
      withdrawal.documents?.forEach((doc) => {
        if (!req.body.documents.find((d) => d.url === doc.url)) {
          filesToDelete.push(doc.url);
        }
      });
    }

    Withdrawal.findOneAndUpdate(
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
      .populate("member", "name email photo phone")
      .populate("timeline.staff", "name email photo phone")
      .then(async (data) => {
        await firebase.notifyStaffs("Cashier", {
          title: "Withdrawal update",
          body: `A Withdrawal has been added. Approve or Disapprove`,
          click_action: `${process.env.SITE_URL}/withdrawals`,
        });
        await cdnHelper.deleteFiles(filesToDelete);
        return responseFn.success(res, { data }, responseStr.record_updated);
      })
      .catch((err) => {
        if (req.files?.length) {
          cdnHelper.deleteFiles(req.files.map((file) => file.path));
        }
        return responseFn.error(res, {}, err.message);
      });
  } catch (error) {
    if (req.files?.length) {
      cdnHelper.deleteFiles(req.files.map((file) => file.path));
    }
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.approve = async (req, res) => {
  try {
    Withdrawal.findOneAndUpdate(
      { _id: req.params._id },
      {
        status: "approved",
        $push: {
          timeline: {
            $each: [
              {
                action: "Approved",
                staff: req.authUser._id,
                dateTime: new Date(),
              },
            ],
          },
        },
      },
      { new: true }
    )
      .populate("member", "name email photo phone")
      .populate("timeline.staff", "name email photo phone")
      .then((data) => {
        if (data) {
          if (data.member) {
            smsHelper.sendSms({
              to: data.member.phone,
              message: smsTemplate.money_withdrawed
                .replace("{name}", data.member.name)
                .replace("{amount}", data.amount.toLocaleString("bn-BD")),
            });
          }
          return responseFn.success(res, { data }, responseStr.record_updated);
        }
        return responseFn.error(res, {}, responseStr.record_not_found);
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.reqDelete = async (req, res) => {
  try {
    Withdrawal.findOneAndUpdate(
      { _id: req.params._id },
      {
        status: "pending-delete",
        $push: {
          timeline: {
            $each: [
              {
                action: "Delete Requested",
                staff: req.authUser._id,
                dateTime: new Date(),
              },
            ],
          },
        },
      }
    )
      .then((num) => responseFn.success(res, {}, responseStr.delete_requested))
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.delete = async (req, res) => {
  try {
    Withdrawal.findOneAndUpdate(
      {
        _id: req.params._id,
        status: "pending-delete",
      },
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
        responseFn.success(res, {}, responseStr.record_deleted);
      })
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
