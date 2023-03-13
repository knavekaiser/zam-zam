module.exports = mongoose.model(
  "Withdrawal",
  new Schema(
    {
      member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
      addedBy: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
      approvedBy: { type: Schema.Types.ObjectId, ref: "Staff" },
      date: { type: Schema.Types.Date, required: true },
      amount: { type: Schema.Types.Number, required: true, min: 1 },
      remark: { type: Schema.Types.String },
      status: {
        type: Schema.Types.String,
        default: "pending-approval",
        required: true,
      },
    },
    { timestamps: true }
  )
);
