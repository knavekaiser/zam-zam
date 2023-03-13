module.exports = mongoose.model(
  "Expense",
  new Schema(
    {
      addedBy: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
      approvedBy: { type: Schema.Types.ObjectId, ref: "Staff" },
      date: { type: Schema.Types.Date, required: true },
      amount: { type: Schema.Types.Number, required: true, min: 1 },
      description: { type: Schema.Types.String, required: true },
      status: {
        type: Schema.Types.String,
        default: "pending-approval",
        required: true,
      },
    },
    { timestamps: true }
  )
);
