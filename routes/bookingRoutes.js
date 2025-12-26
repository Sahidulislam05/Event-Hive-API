const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const router = express.Router();

// 1. Create Booking (Handle Seat Count & Waitlist)
router.post("/", async (req, res) => {
  const { eventId, userEmail, ...bookingData } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = await Event.findById(eventId).session(session);

    if (!event) {
      throw new Error("Event not found");
    }

    let newStatus = "confirmed";

    // Logic: Check Seats
    if (event.availableSeats > 0) {
      // Seat available -> Reduce count
      event.availableSeats -= 1;
      await event.save({ session });
    } else {
      // No Seat -> Add to Waitlist
      newStatus = "waitlist";
    }

    // Create Booking
    const newBooking = await Booking.create(
      [
        {
          eventId,
          userEmail,
          status: newStatus,
          ...bookingData,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.send({
      success: true,
      booking: newBooking[0],
      message:
        newStatus === "waitlist" ? "Added to waitlist" : "Booking Confirmed",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).send({ message: error.message });
  }
});

// 2. Get My Bookings
router.get("/:email", async (req, res) => {
  const result = await Booking.find({ userEmail: req.params.email });
  res.send(result);
});

// 3. Cancel Booking (Handle 40% Logic & Seat Increment)
router.delete("/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) return res.status(404).send("Booking not found");

    // Date logic
    const eventDate = new Date(booking.eventDate);
    const today = new Date();
    const daysDiff = (eventDate - today) / (1000 * 3600 * 24);

    let refundAmount = booking.price;
    let message = "Full Refund Initiated";

    if (daysDiff < 2) {
      refundAmount = booking.price * 0.6;
      message = "40% Fee Deducted. Partial Refund Initiated.";
    }

    // Seat back
    if (booking.status === "confirmed") {
      await Event.findByIdAndUpdate(
        booking.eventId,
        { $inc: { availableSeats: 1 } },
        { session }
      );
    }

    await Booking.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.send({ refundAmount, message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
