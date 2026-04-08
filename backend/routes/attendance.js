const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// Attendance schema
const attendanceSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["present", "absent"], default: "present" }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

// 📍 Barcha attendance yozuvlarini olish
router.get("/", async (req, res) => {
  const records = await Attendance.find();
  res.json(records);
});

// 📍 Yangi attendance yozuv qo‘shish
router.post("/", async (req, res) => {
  try {
    const newRecord = new Attendance(req.body);
    await newRecord.save();
    res.json({ message: "✅ Attendance saved", record: newRecord });
  } catch (error) {
    res.status(500).json({ message: "❌ Error saving attendance", error });
  }
});

module.exports = router;
