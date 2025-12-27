const express = require("express");
const Event = require("../models/Event");
const router = express.Router();
const { verifyJWT, verifyAdmin } = require("../middlewares/authMiddleware");

// 1. Add New Event
router.post("/", verifyJWT, async (req, res) => {
  const eventData = req.body;
  // ensure availableSeats matches totalSeats initially
  eventData.availableSeats = parseInt(eventData.totalSeats);
  const result = await Event.create(eventData);
  res.send(result);
});

// 2. Get All Events (With Search/Filter logic later)
router.get("/", async (req, res) => {
  const result = await Event.find().sort({ createdAt: -1 });
  res.send(result);
});

// 3. Get Single Event
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const result = await Event.findById(id);
  res.send(result);
});

// Manager deletes only their own event
router.delete("/manager/:id", verifyJWT, async (req, res) => {
  const id = req.params.id;
  const email = req.tokenEmail;

  const event = await Event.findById(id);

  if (!event) {
    return res.status(404).send({ message: "Event not found" });
  }

  if (event.organizerEmail !== email) {
    return res
      .status(403)
      .send({ message: "You can only delete your own events!" });
  }

  const result = await Event.findByIdAndDelete(id);
  res.send(result);
});

router.delete(
  "/admin-manager/:id",
  verifyJWT,
  verifyAdmin,
  async (req, res) => {
    const id = req.params.id;
    const result = await Event.findByIdAndDelete(id);
    res.send(result);
  }
);

// 4. Get Events by Manager Email
router.get("/manager/:email", verifyJWT, async (req, res) => {
  const result = await Event.find({ organizerEmail: req.params.email });
  res.send(result);
});

module.exports = router;
