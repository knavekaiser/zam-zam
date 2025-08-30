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
  Income: require("./income.model"),
  Expense: require("./expense.model"),
  Deposit: require("./deposit.model"),
  Withdrawal: require("./withdrawal.model"),
  Role: require("./role.model"),
  Milestone: require("./milestone.model"),
  Supplier: require("./supplier.model"),
  Bill: require("./bill.model"),
  Device: require("./device.model"),
  BugReport: require("./bugReport.model"),
  FeedPost: require("./feedPost.model"),
  Comment: require("./comment.model"),
};
