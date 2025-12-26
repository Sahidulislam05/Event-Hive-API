const express = require("express");
const Event = require("../models/Event");
const router = express.Router();

// 1. Add New Event
router.post("/", async (req, res) => {
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

// 4. Get Events by Manager Email
router.get("/manager/:email", async (req, res) => {
  const result = await Event.find({ organizerEmail: req.params.email });
  res.send(result);
});

module.exports = router;
