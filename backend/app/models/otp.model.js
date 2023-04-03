const { appConfig } = require("../config");

module.exports = mongoose.model(
  "Otp",
  new Schema(
    {
      user: { type: Schema.Types.String, required: true, unique: true },
      code: { type: Schema.Types.String, required: true },
      expireAt: {
        type: Schema.Types.Date,
        default: Date.now,
        index: { expires: `${appConfig.otpTimeout}s` },
      },
      attempts: { type: Schema.Types.Number, default: 0 },
    },
    { timestamps: true }
  )
);
//
