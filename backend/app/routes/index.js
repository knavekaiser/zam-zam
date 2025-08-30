module.exports = function (app) {
  require("./member.routes")(app);
  require("./staff.routes")(app);
  require("./deposit.routes")(app);
  require("./milestone.routes")(app);
  require("./expense.routes")(app);
  require("./incomes.routes")(app);
  require("./withdrawal.routes")(app);
  require("./role.routes")(app);
  require("./supplier.routes")(app);
  require("./bills.routes")(app);
  require("./common.routes")(app);
  // require("./feed.routes")(app);
};
