module.exports = mongoose.model(
  "Withdrawal",
  new Schema(
    {
      member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
      date: { type: Schema.Types.Date, required: true },
      amount: { type: Schema.Types.Number, required: true, min: 1 },
      remark: { type: Schema.Types.String },
      status: {
        type: Schema.Types.String,
        default: "pending-approval",
        required: true,
      },
      timeline: [
        new Schema({
          action: { type: Schema.Types.String, required: true },
          dateTime: { type: Schema.Types.Date, required: true },
          staff: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
        }),
      ],
    },
    { timestamps: true }
  )
);
