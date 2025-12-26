const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    eventDate: Date,
    eventName: String,
    eventImage: String,

    userEmail: { type: String, required: true },
    userName: String,

    price: Number,
    transactionId: String,

    status: {
      type: String,
      enum: ["confirmed", "waitlist", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
