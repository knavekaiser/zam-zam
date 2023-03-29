module.exports = mongoose.model(
  "Device",
  new Schema(
    {
      name: { type: Schema.Types.String },
      platform: { type: Schema.Types.String, required: true },
      deviceId: { type: Schema.Types.String, required: true, unique: true },
      fcmToken: { type: Schema.Types.String },
    },
    { timestamps: true }
  )
);
