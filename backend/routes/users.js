const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  surname: String,
  phone: String,
  birthdate: Date,
});

const User = mongoose.model("User", userSchema);

// 📍 Barcha userlarni olish
router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// 📍 Yangi user qo‘shish
router.post("/", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.json({ message: "✅ User saved", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "❌ Error saving user", error });
  }
});

module.exports = router;
