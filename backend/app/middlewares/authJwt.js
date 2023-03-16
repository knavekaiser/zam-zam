const jwt = require("jsonwebtoken");
const {
  appConfig: { responseFn },
} = require("../config");

const { Member, Staff } = require("../models");
const { responseStr } = require("../config/app.config");

verifyToken = async (req, res, next) => {
  // let token = req.cookies.access_token;
  const token = req.headers["x-access-token"];

  if (!token) {
    return responseFn.error(res, {}, "No token provided!", 403);
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return responseFn.error(res, {}, "Unauthorized!", 401);
    }

    let Model = Member;
    if (decoded.userType === "staff") {
      Model = Staff;
    }
    const user = await Model.findOne({ _id: decoded.sub, status: "active" });

    if (!user) {
      return responseFn.error(res, {}, "Unauthorized!", 401);
    }

    req.authUser = user;
    req.authToken = decoded;
    next();
  });
};

checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.authToken?.userType === "business") {
      return next();
    } else if (req.authToken?.userType === "staff") {
      if (req.permissions.includes(permission)) {
        return next();
      }
    }
    return responseFn.error(res, {}, responseStr.forbidden, 403);
  };
};

const authJwt = { verifyToken, checkPermission };
module.exports = authJwt;
