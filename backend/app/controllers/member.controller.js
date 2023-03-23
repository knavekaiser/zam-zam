const {
  appConfig: { responseFn, responseStr, smsTemplate, ...appConfig },
} = require("../config");
const {
  smsHelper,
  appHelper: { genId, ...appHelper },
  fileHelper,
} = require("../helpers");

const { Member, Otp, Role } = require("../models");

exports.signup = async (req, res) => {
  try {
    req.body.password = appHelper.generateHash(req.body.password);

    const role = await Role.findOne({ name: "Member" });
    new Member({
      ...req.body,
      role: role?._id || null,
      status: "pending-activation",
    })
      .save()
      .then(async (user) => {
        return responseFn.success(
          res,
          {},
          responseStr.registration_successful_pending_activation
        );
        // return appHelper.signIn(res, user._doc, "member");
      })
      .catch((err) => {
        return responseFn.error(res, {}, err.message);
      });
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.login = async (req, res) => {
  try {
    const user = await Member.findOne({ phone: req.body.phone }).populate(
      "role",
      "name permissions"
    );

    if (!user || !appHelper.compareHash(req.body.password, user.password)) {
      return responseFn.error(res, {}, responseStr.invalid_cred);
    }
    if (user.status === "pending-activation") {
      return responseFn.error(res, {}, responseStr.account_pending_activation);
    }
    if (user.status !== "active") {
      return responseFn.error(res, {}, responseStr.account_deactivated);
    }
    return appHelper.signIn(res, user._doc, "member");
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const member = await Member.findOne({ phone: req.body.phone });

    if (member) {
      const otp = genId(6, { numbers: true });
      new Otp({
        user: member._id,
        code: appHelper.generateHash(otp),
      })
        .save()
        .then(async (otpRec) => {
          const result = await smsHelper.sendSms({
            to: member.phone,
            message: smsTemplate.password_otp
              .replace("{name}", member.name)
              .replace("{otp}", otp),
          });
          if (result.success) {
            return responseFn.success(
              res,
              {
                data: {
                  phone: member.phone,
                  timeout: appConfig.otpTimeout,
                },
              },
              responseStr.otp_sent + ` (use ${otp})`
            );
          } else {
            await Otp.deleteOne({ _id: otpRec._id });
            return responseFn.error(res, {}, responseStr.otp_sms_failed);
          }
        })
        .catch(async (err) => {
          if (err.code === 11000) {
            const otpRec = await Otp.findOne({ user: member._id });

            return responseFn.error(
              res,
              {
                cooldown: parseInt(
                  appConfig.otpTimeout -
                    (new Date() - new Date(otpRec.createdAt)) / 1000
                ),
              },
              responseStr.otp_sent_already
            );
          }
          return responseFn.error(res, {}, err.message, 500);
        });
    } else {
      return responseFn.error(res, {}, responseStr.record_not_found);
    }
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await Member.findOne({ phone: req.body.phone });
    const otpRec = await Otp.findOne({ user: user._id });
    if (!otpRec) {
      return responseFn.error(res, {}, responseStr.otp_not_found);
    }
    if (appHelper.compareHash(req.body.code, otpRec.code)) {
      await Member.updateOne(
        { _id: user._id },
        { password: appHelper.generateHash(req.body.password) }
      );
      await Otp.deleteOne({ _id: otpRec._id });
      return responseFn.success(res, {}, responseStr.password_reset_successful);
    } else {
      if (otpRec.attempts >= appConfig.passwordResetOtpAttepts - 1) {
        await Otp.deleteOne({ _id: otpRec._id });
        return responseFn.error(
          res,
          {},
          responseStr.too_many_attempts_to_reset_password
        );
      } else {
        await Otp.updateOne({ _id: otpRec._id }, { $inc: { attempts: 1 } });
        return responseFn.error(
          res,
          {
            attemptsLeft:
              appConfig.passwordResetOtpAttepts - (otpRec.attempts + 1),
          },
          responseStr.wrong_otp.replace(
            "{NUM}",
            appConfig.passwordResetOtpAttepts - (otpRec.attempts + 1)
          )
        );
      }
    }
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("access_token");
    return responseFn.success(res, {});
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.profile = (req, res) => {
  try {
    Member.findOne({ _id: req.authUser.id }, "-password -__v -updatedAt")
      .populate("role", "name permissions")
      .then(async (data) =>
        responseFn.success(res, {
          data: { ...data._doc, userType: "member" },
        })
      )
      .catch((error) => responseFn.error(res, {}, error.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.files?.photo?.length && req.authUser.photo) {
      fileHelper.deleteFiles(req.authUser.photo);
    }
    const update = {};
    ["name", "email", "photo"].forEach((key) => {
      if (key in req.body) {
        update[key] = req.body[key];
      }
    });
    Member.findOneAndUpdate({ _id: req.authUser._id }, update, { new: true })
      .populate("role", "name permissions")
      .then((data) => {
        if (data) {
          return responseFn.success(
            res,
            {
              data: {
                ...data._doc,
                userType: "member",
                password: undefined,
                __v: undefined,
                updatedAt: undefined,
              },
            },
            responseStr.record_updated
          );
        }
        return responseFn.error(res, {}, responseStr.record_not_found);
      })
      .catch((error) => responseFn.error(res, {}, error.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.activate = async (req, res) => {
  try {
    Member.findOneAndUpdate(
      { _id: req.params._id, status: "pending-activation" },
      { status: "active" },
      { new: true }
    )
      .populate("role", "name permissions")
      .then(async (data) => {
        await smsHelper.sendSms({
          to: data.phone,
          message: smsTemplate.account_activated,
        });
        responseFn.success(
          res,
          {
            data: {
              ...data._doc,
              userType: "member",
              password: undefined,
              __v: undefined,
              updatedAt: undefined,
            },
          },
          responseStr.record_updated
        );
      })
      .catch((error) => responseFn.error(res, {}, error.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.get = async (req, res) => {
  try {
    const conditions = {
      // add filters here,
    };
    if ("name" in req.query) {
      conditions.name = {
        $regex: req.query.name,
        $options: "i",
      };
    }
    if ("status" in req.query) {
      conditions.status = req.query.status;
    }
    Member.aggregate([
      { $match: conditions },
      {
        $lookup: {
          from: "deposits",
          as: "deposit",
          let: { member_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$member", "$$member_id"] },
                status: "approved",
              },
            },
            { $group: { _id: null, amount: { $sum: "$amount" } } },
          ],
        },
      },
      { $set: { deposit: { $first: "$deposit.amount" } } },
      {
        $lookup: {
          from: "withdrawals",
          as: "withdrawal",
          let: { member_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$member", "$$member_id"] },
                status: "approved",
              },
            },
            { $group: { _id: null, amount: { $sum: "$amount" } } },
          ],
        },
      },
      { $set: { withdrawal: { $first: "$withdrawal.amount" } } },
      { $project: { __v: 0, password: 0 } },
    ])
      .then((data) => responseFn.success(res, { data }))
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    req.body.password = appHelper.generateHash(req.body.password);

    const role = await Role.findOne({ name: "Member" });
    new Member({
      ...req.body,
      role: role?._id || null,
    })
      .save()
      .then(async (user) => {
        return responseFn.success(res, { data: user });
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
    const update = {};
    ["name", "role", "email", "status", "address"].forEach((key) => {
      if (req.body[key]) {
        update[key] = req.body[key];
      }
    });
    Member.findOneAndUpdate({ _id: req.params._id }, update, { new: true })
      .populate("role", "name permissions")
      .then((data) =>
        responseFn.success(
          res,
          {
            data: {
              ...data._doc,
              password: undefined,
              __v: undefined,
              updatedAt: undefined,
            },
          },
          responseStr.record_updated
        )
      )
      .catch((error) => responseFn.error(res, {}, error.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.find = (req, res) => {
  try {
    const conditions = {
      // add filters here,
      status: "active",
    };
    if ("name" in req.query) {
      conditions.name = {
        $regex: req.query.name,
        $options: "i",
      };
    }
    Member.aggregate([
      { $match: conditions },
      {
        $lookup: {
          from: "deposits",
          as: "deposit",
          pipeline: [
            { $match: { status: "approved" } },
            { $group: { _id: null, amount: { $sum: "$amount" } } },
          ],
        },
      },
      { $set: { deposit: { $first: "$deposit.amount" } } },
      {
        $lookup: {
          from: "withdrawals",
          as: "withdrawal",
          pipeline: [
            { $match: { status: "approved" } },
            { $group: { _id: null, amount: { $sum: "$amount" } } },
          ],
        },
      },
      { $set: { withdrawal: { $first: "$withdrawal.amount" } } },
      { $project: { __v: 0, password: 0 } },
    ])
      .then((data) => responseFn.success(res, { data }))
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
