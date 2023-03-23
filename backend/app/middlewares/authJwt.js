const jwt = require("jsonwebtoken");
const {
  appConfig: { responseFn, responseStr },
} = require("../config");

const { Member, Staff } = require("../models");

exports.verifyToken_old = async (req, res, next) => {
  // let token = req.cookies.access_token;
  const token = req.headers["x-access-token"];

  if (!token) {
    return responseFn.error(res, {}, "No token provided!", 403);
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return responseFn.error(res, {}, responseStr.unauthorized, 401);
    }

    let Model = Member;
    if (decoded.userType === "staff") {
      Model = Staff;
    }
    const user = await Model.findOne({ _id: decoded.sub, status: "active" });

    if (!user) {
      return responseFn.error(res, {}, responseStr.unauthorized, 401);
    }

    req.authUser = user;
    req.authToken = decoded;
    next();
  });
};

exports.verifyToken = (permission) => {
  return async (req, res, next) => {
    // let token = req.cookies.access_token;
    const token = req.headers["x-access-token"];

    if (!token) {
      return responseFn.error(res, {}, "No token provided!", 403);
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return responseFn.error(res, {}, responseStr.unauthorized, 401);
      }

      let Model = Member;
      if (decoded.userType === "staff") {
        Model = Staff;
      }
      const user = await Model.findOne({
        _id: decoded.sub,
        status: "active",
      }).populate("role", "name permissions");

      if (!user) {
        return responseFn.error(res, {}, responseStr.unauthorized, 401);
      }
      if (permission && !user.role?.permissions?.includes(permission)) {
        return responseFn.error(res, {}, responseStr.forbidden, 403);
      }

      req.authUser = user;
      req.authToken = decoded;
      next();
    });
  };
};
