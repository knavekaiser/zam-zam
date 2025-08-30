module.exports = mongoose.model(
  "Supplier",
  new Schema(
    {
      name: { type: Schema.Types.String, required: true },
      phones: [{ type: Schema.Types.String }],
      address: { type: Schema.Types.String },
    },
    { timestamps: true }
  )
);
