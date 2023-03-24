module.exports = mongoose.model(
  "Milestone",
  new Schema(
    {
      title: { type: Schema.Types.String, required: true },
      description: { type: Schema.Types.String },
      startDate: { type: Schema.Types.Date, required: true },
      endDate: { type: Schema.Types.Date, required: true },
      amount: { type: Schema.Types.Number, required: true },
      status: {
        type: Schema.Types.String,
        default: "upcoming",
        required: true,
      },
    },
    { timestamps: true }
  )
);
