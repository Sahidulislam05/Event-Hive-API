const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    date: { type: Date, required: true },
    price: { type: Number, required: true },

    // Organizer Info
    organizerName: String,
    organizerEmail: String,
    organizerPhoto: String,

    // Seat Management
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Event", eventSchema);
