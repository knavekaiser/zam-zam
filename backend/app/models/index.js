global.mongoose = require("mongoose");
global.Schema = mongoose.Schema;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connected to db"))
  .catch((err) => console.log("could not connect to db, here's why: " + err));

module.exports = {
  Member: require("./member.model"),
  Staff: require("./staff.model"),
  Otp: require("./otp.model"),
  Deposit: require("./deposit.model"),
  Expense: require("./expense.model"),
  Withdrawal: require("./withdrawal.model"),
  Role: require("./role.model"),
  Milestone: require("./milestone.model"),
  Device: require("./device.model"),
};
