const express = require("express");
const User = require("../models/User");
const router = express.Router();

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
router.get("/", async (req, res) => {
  const result = await User.find();
  res.send(result);
});

// 3. Request to become Manager
router.patch("/request-manager/:email", async (req, res) => {
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
router.patch("/admin/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: id };
  const updateDoc = {
    $set: { role: "event-manager", status: "verified" },
  };
  const result = await User.updateOne(filter, updateDoc);
  res.send(result);
});

// Checking user role
router.get("/users/role/:email", async (req, res) => {
  const email = req.params.email;
  const user = await User.findOne({ email });
  res.send({ role: user?.role });
});

module.exports = router;
