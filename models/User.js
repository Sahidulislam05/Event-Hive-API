const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    photoURL: String,
    role: {
      type: String,
      enum: ["user", "event-manager", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["verified", "banned", "requested"],
      default: "verified",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
