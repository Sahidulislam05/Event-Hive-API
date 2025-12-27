const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { verifyJWT } = require("../middlewares/authMiddleware");

// 1. Create Booking (Handle Seat Count & Wait-list)
router.post("/", verifyJWT, async (req, res) => {
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
router.get("/:email", verifyJWT, async (req, res) => {
  const result = await Booking.find({ userEmail: req.params.email });
  res.send(result);
});

// 3. Cancel Booking (Handle 40% Logic & Seat Increment)
router.delete("/:id", verifyJWT, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).send("Booking not found");
    }

    const eventDate = new Date(booking.eventDate);
    const today = new Date();
    const timeDiff = eventDate - today;
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    let refundAmount = 0;
    let deductionAmount = 0;
    let message = "";

    if (daysDiff < 0) {
      return res.status(400).send({
        message: "Cannot cancel booking after event has started or passed.",
      });
    } else if (daysDiff < 2) {
      deductionAmount = booking.price * 0.4;
      refundAmount = booking.price * 0.6;
      message = "Partial Refund: 40% Fee Deducted.";
    } else {
      refundAmount = booking.price;
      message = "Full Refund Initiated.";
    }

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

    res.send({
      success: true,
      refundAmount,
      deductionAmount,
      totalPaid: booking.price,
      message,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Cancellation Error:", err);
    res
      .status(500)
      .send({ error: "Something went wrong during cancellation." });
  }
});

// Payment
router.post("/create-checkout-session", verifyJWT, async (req, res) => {
  try {
    const { eventId, eventName, eventDate, userEmail, userName, price, image } =
      req.body;

    const event = await Event.findById(eventId);
    if (!event || event.availableSeats < 1) {
      return res
        .status(400)
        .send({ error: "No seats available or Event not found" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: eventName,
              description: `Booking for ${userName}`,
              images: [image],
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: userEmail,

      metadata: {
        eventId: eventId,
        eventName: eventName,
        eventDate: eventDate,
        userEmail: userEmail,
        userName: userName,
        price: price,
      },

      success_url: `${process.env.CLIENT_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_DOMAIN}/event-details/${eventId}?canceled=true`,
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).send({ error: error.message });
  }
});

// Check payment
router.post("/session-status", verifyJWT, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res
        .status(400)
        .send({ success: false, message: "Session ID required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const transactionId = session.payment_intent;
      const { eventId, eventName, eventDate, userEmail, userName, price } =
        session.metadata;

      const existingBooking = await Booking.findOne({ transactionId });
      if (existingBooking) {
        return res.send({
          success: true,
          message: "Booking already exists",
          booking: existingBooking,
        });
      }

      const newBooking = new Booking({
        eventId,
        eventName,
        eventDate,
        userEmail,
        userName,
        price: Number(price),
        transactionId,
        status: "confirmed",
      });

      const bookingResult = await newBooking.save();

      await Event.findByIdAndUpdate(eventId, { $inc: { availableSeats: -1 } });

      return res.send({ success: true, booking: bookingResult });
    } else {
      return res.send({ success: false, message: "Payment not completed" });
    }
  } catch (err) {
    console.error("Session Status Error:", err);
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
