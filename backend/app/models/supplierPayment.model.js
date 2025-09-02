module.exports = mongoose.model(
  "SupplierPayment",
  new Schema(
    {
      supplier: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Supplier",
      },
      date: { type: Schema.Types.Date, required: true },
      amount: { type: Schema.Types.Number, required: true },
      paymentMethod: { type: Schema.Types.String, required: true },
      bills: [{ type: Schema.Types.String, ref: "Bill" }],
      documents: [
        new Schema({
          name: { type: Schema.Types.String, required: true },
          url: { type: Schema.Types.String, required: true },
          mime: { type: Schema.Types.String, required: true },
          size: { type: Schema.Types.Number, required: true },
        }),
      ],
    },
    { timestamps: true }
  )
);
