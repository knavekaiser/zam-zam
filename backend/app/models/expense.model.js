module.exports = mongoose.model(
  "Expense",
  new Schema(
    {
      date: { type: Schema.Types.Date, required: true },
      amount: { type: Schema.Types.Number, required: true, min: 1 },
      description: { type: Schema.Types.String, required: true },
      status: {
        type: Schema.Types.String,
        default: "pending-approval",
        required: true,
      },
      documents: [
        new Schema({
          name: { type: Schema.Types.String, required: true },
          url: { type: Schema.Types.String, required: true },
          mime: { type: Schema.Types.String, required: true },
          size: { type: Schema.Types.Number, required: true },
        }),
      ],
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
