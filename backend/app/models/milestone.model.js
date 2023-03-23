module.exports = mongoose.model(
  "Milestone",
  new Schema(
    {
      title: { type: Schema.Types.String, required: true },
      description: { type: Schema.Types.String },
      start_date: { type: Schema.Types.Date, required: true },
      end_date: { type: Schema.Types.Date, required: true },
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
