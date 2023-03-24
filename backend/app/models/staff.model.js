module.exports = mongoose.model(
  "Staff",
  new Schema(
    {
      username: {
        type: Schema.Types.String,
        unique: [true, "username is taken"],
        sparse: true,
      },
      name: { type: Schema.Types.String, min: 3, required: true },
      photo: { type: Schema.Types.String },
      phone: {
        type: Schema.Types.String,
        min: 8,
        required: true,
        unique: [true, "Phone is already in use"],
      },
      password: { type: Schema.Types.String, min: 10, required: true },
      email: {
        type: Schema.Types.String,
        unique: [true, "Email is already in use"],
        sparse: true,
      },
      address: { type: Schema.Types.String },
      status: {
        type: Schema.Types.String,
        default: "inactive",
      },
      role: { type: Schema.Types.ObjectId, ref: "Role" },
      devices: [{ type: Schema.Types.String }],
    },
    { timestamps: true }
  )
);
