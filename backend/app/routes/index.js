module.exports = function (app) {
  require("./member.routes")(app);
  require("./staff.routes")(app);
  require("./deposit.routes")(app);
  require("./expense.routes")(app);
  require("./withdrawal.routes")(app);
  require("./role.routes")(app);
  require("./common.routes")(app);
};
