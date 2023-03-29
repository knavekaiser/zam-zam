module.exports = mongoose.model(
  "BugReport",
  new Schema(
    {
      name: { type: Schema.Types.String },
      message: { type: Schema.Types.String },
      dscr: { componentStack: { type: Schema.Types.String } },
      detail: { type: Schema.Types.String },
      link: { type: Schema.Types.String },
    },
    { timestamps: true }
  )
);
