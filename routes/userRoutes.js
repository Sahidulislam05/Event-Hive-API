const express = require("express");
const User = require("../models/User");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const router = express.Router();
const { verifyJWT, verifyAdmin } = require("../middlewares/authMiddleware");

// 1. Save or Update User (Registration/Login)
router.post("/", async (req, res) => {
  const user = req.body;
  const query = { email: user.email };

  const existingUser = await User.findOne(query);
  if (existingUser) {
    await User.updateOne(
      { email: user.email },
      { $setOnInsert: user },
      { upsert: true }
    );
    return res.send({ message: "User already exists", insertedId: null });
  }
  //   const result = await User.create(user);
  const newUser = new User(user);
  const result = await newUser.save();
  res.send(result);
});

// 2. Get All Users (Admin only)
router.get("/", verifyJWT, verifyAdmin, async (req, res) => {
  const result = await User.find();
  res.send(result);
});

// 3. Request to become Manager
router.patch("/request-manager/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;
  const filter = { email: email };
  const user = await User.findOne({ email });
  if (user.status === "requested") {
    return res.status(400).send({ message: "Already requested" });
  }
  const updateDoc = {
    $set: { status: "requested" },
  };
  const result = await User.updateOne(filter, updateDoc);
  res.send(result);
});

// 4. Admin Approves Manager
router.patch("/admin/:id", verifyJWT, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: id };
  const updateDoc = {
    $set: { role: "manager", status: "verified" },
  };
  const result = await User.updateOne(filter, updateDoc);
  res.send(result);
});

// Checking user role
router.get("/role/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;
  const user = await User.findOne({ email });
  res.send({ role: user?.role });
});

// 5. Admin Deletes a User (Admin only)
router.delete("/delete/:id", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    if (user.email === req.tokenEmail) {
      return res
        .status(403)
        .send({ message: "You cannot delete your own admin account!" });
    }

    const userBookings = await Booking.find({ userEmail: user.email });

    for (const booking of userBookings) {
      if (booking.status === "confirmed") {
        await Event.findByIdAndUpdate(booking.eventId, {
          $inc: { availableSeats: 1 },
        });
      }
    }

    const result = await User.findByIdAndDelete(id);
    await Booking.deleteMany({ userEmail: user.email });

    res.send({
      success: true,
      message: "User and their bookings deleted, seats restored.",
      result,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
