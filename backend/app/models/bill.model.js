const { genId } = require("../helpers/app.helper");

module.exports = mongoose.model(
  "Bill",
  new Schema(
    {
      ref: { type: String },
      _id: {
        type: String,
        default: () =>
          genId(8, { uppercase: true, letters: true, numbers: true }),
      },
      date: { type: Schema.Types.Date, required: true },
      description: { type: Schema.Types.String },
      supplier: {
        type: Schema.Types.ObjectId,
        ref: "Supplier",
        required: true,
      },
      items: [
        new Schema({
          name: { type: Schema.Types.String, required: true },
          qty: { type: Schema.Types.Number, required: true },
          unit: { type: Schema.Types.String, required: true },
          rate: { type: Schema.Types.Number, required: true },
        }),
      ],
      returns: [
        new Schema({
          name: { type: Schema.Types.String, required: true },
          qty: { type: Schema.Types.Number, required: true },
          unit: { type: Schema.Types.String, required: true },
          rate: { type: Schema.Types.Number, required: true },
        }),
      ],
      charges: [
        new Schema({
          name: { type: Schema.Types.String, required: true },
          amount: { type: Schema.Types.Number, required: true },
        }),
      ],
      adjustment: { type: Schema.Types.Number, default: 0 },
      documents: [
        new Schema({
          name: { type: Schema.Types.String, required: true },
          url: { type: Schema.Types.String, required: true },
          mime: { type: Schema.Types.String, required: true },
          size: { type: Schema.Types.Number, required: true },
        }),
      ],
      payments: [
        new Schema({
          date: { type: Schema.Types.Date, required: true },
          amount: { type: Schema.Types.Number, required: true },
          paymentMethod: { type: Schema.Types.String, required: true },
          documents: [
            new Schema({
              name: { type: Schema.Types.String, required: true },
              url: { type: Schema.Types.String, required: true },
              mime: { type: Schema.Types.String, required: true },
              size: { type: Schema.Types.Number, required: true },
            }),
          ],
        }),
      ],
    },
    { timestamps: true }
  )
);
