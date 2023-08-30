const { Schema } = require("mongoose");
const { appConfig } = require("../config");

module.exports = mongoose.model(
  "Feed Post",
  new Schema(
    {
      user: { type: Schema.Types.ObjectId, required: true },
      userType: {
        type: Schema.Types.String,
        required: true,
        enum: ["member", "staff"],
      },
      content: {
        text: { type: Schema.Types.String, required: true },
        media: [
          new Schema({
            name: { type: Schema.Types.String, required: true },
            mimetype: { type: Schema.Types.String, required: true },
            size: { type: Schema.Types.Number, required: true },
            url: { type: Schema.Types.String, required: true },
          }),
        ],
      },
      likes: [],
    },
    { timestamps: true }
  )
);
