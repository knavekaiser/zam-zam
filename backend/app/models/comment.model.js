const { Schema } = require("mongoose");
const { appConfig } = require("../config");

module.exports = mongoose.model(
  "Comment",
  new Schema(
    {
      parent: { type: Schema.Types.ObjectId, required: true },
      parentType: {
        type: Schema.Types.String,
        required: true,
        enum: ["post", "comment"],
      },
      userType: {
        type: Schema.Types.String,
        required: true,
        enum: ["staff", "member"],
      },
      user: { type: Schema.Types.ObjectId, required: true },
      content: {
        text: { type: Schema.Types.String, required: true },
      },
      likes: [],
    },
    { timestamps: true }
  )
);
