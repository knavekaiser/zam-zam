const {
  appConfig: { responseFn, responseStr, smsTemplate, ...appConfig },
} = require("../config");
const {
  appHelper: { genId, ...appHelper },
  smsHelper,
  fileHelper,
  firebase,
} = require("../helpers");

const { Staff, Otp } = require("../models");

exports.signup = async (req, res) => {
  try {
    req.body.password = appHelper.generateHash(req.body.password);

    new Staff({ ...req.body, status: "pending-activation" })
      .save()
      .then(async (staff) => {
        await firebase.notifyStaffs("Manager", {
          title: "New Staff Sign Up",
          body: `${staff.name} (${staff.phone}) has just signed up. Approve or Disapprove`,
          click_action: `${process.env.SITE_URL}/staffs`,
        });
        return responseFn.success(
          res,
          {},
          responseStr.registration_successful_pending_activation
        );
        // return appHelper.signIn(res, staff._doc, "staff");
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
    const staff = await Staff.findOne({ phone: req.body.phone }).populate(
      "role",
      "name permissions"
    );

    if (!staff || !appHelper.compareHash(req.body.password, staff.password)) {
      return responseFn.error(res, {}, responseStr.invalid_cred);
    }
    if (staff.status === "pending-activation") {
      return responseFn.error(res, {}, responseStr.account_pending_activation);
    }
    if (staff.status !== "active") {
      return responseFn.error(res, {}, responseStr.account_deactivated);
    }
    await Staff.findOneAndUpdate(
      { _id: staff._id },
      { devices: [...new Set([...(staff.devices || []), req.body.deviceId])] },
      { new: true }
    );
    return appHelper.signIn(res, staff._doc, "staff");
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const staff = await Staff.findOne({ phone: req.body.phone });

    if (staff) {
      const otp = genId(6, { numbers: true });
      new Otp({
        user: staff._id,
        code: appHelper.generateHash(otp),
      })
        .save()
        .then(async (otpRec) => {
          const result = await smsHelper.sendSms({
            to: staff.phone,
            message: smsTemplate.password_otp
              .replace("{name}", staff.name)
              .replace("{otp}", otp),
          });
          if (result.success) {
            return responseFn.success(
              res,
              {
                data: {
                  phone: staff.phone,
                  timeout: appConfig.otpTimeout,
                },
              },
              `${responseStr.otp_sent}${
                process.env.MODE === "development" ? `(use ${otp})` : ""
              }`
            );
          } else {
            await Otp.deleteOne({ _id: otpRec._id });
            return responseFn.error(res, {}, responseStr.otp_sms_failed);
          }
        })
        .catch(async (err) => {
          if (err.code === 11000) {
            const otpRec = await Otp.findOne({ user: staff._id });

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
    const staff = await Staff.findOne({ phone: req.body.phone });
    const otpRec = await Otp.findOne({ user: staff._id });
    if (!otpRec) {
      return responseFn.error(res, {}, responseStr.otp_not_found);
    }
    if (appHelper.compareHash(req.body.code, otpRec.code)) {
      await Staff.updateOne(
        { _id: staff._id },
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
    await Staff.findOneAndUpdate(
      { _id: req.authUser._id },
      {
        devices: (req.authUser.devices || []).filter(
          (item) => item !== req.body.deviceId
        ),
      }
    );
    res.clearCookie("access_token");
    return responseFn.success(res, {});
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.profile = (req, res) => {
  try {
    Staff.findOne(
      { _id: req.authUser.id },
      "-password -__v -updatedAt -devices"
    )
      .populate("role", "name permissions")
      .then(async (data) => {
        responseFn.success(res, {
          data: {
            ...data._doc,
            userType: "staff",
          },
        });
      })
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
    Staff.findOneAndUpdate({ _id: req.authUser._id }, update, { new: true })
      .populate("role", "name permissions")
      .then((data) =>
        responseFn.success(
          res,
          {
            data: {
              ...data._doc,
              userType: "staff",
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

exports.activate = async (req, res) => {
  try {
    Staff.findOneAndUpdate(
      { _id: req.params._id },
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

exports.update = async (req, res) => {
  try {
    const update = {};
    ["name", "role", "email", "status", "address"].forEach((key) => {
      if (req.body[key]) {
        update[key] = req.body[key];
      }
    });
    Staff.findOneAndUpdate({ _id: req.params._id }, update, { new: true })
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
      _id: { $ne: req.authUser._id },
    };
    if ("name" in req.query) {
      conditions.name = {
        $regex: req.query.name,
        $options: "i",
      };
    }
    // Staff.aggregate([
    //   { $match: conditions },
    //   { $project: { __v: 0, password: 0 } },
    // ])
    Staff.find(conditions, "-__v -password")
      .populate("role", "name permissions")
      .then((data) => {
        responseFn.success(res, { data });
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
