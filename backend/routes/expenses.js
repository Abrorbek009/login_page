const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "manual" },
  },
  { timestamps: true },
);

const Expense =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

router.get("/", async (req, res) => {
  const expenses = await Expense.find().sort({ createdAt: -1 });
  res.json(expenses);
});

router.delete("/demo/all", async (req, res) => {
  const result = await Expense.deleteMany({ source: "demo" });
  res.json({ success: true, deletedCount: result.deletedCount || 0 });
});

router.post("/", async (req, res) => {
  try {
    const expense = await Expense.create({
      title: req.body?.title,
      category: req.body?.category,
      amount: Number(req.body?.amount || 0),
      note: req.body?.note || "",
      source: req.body?.source || "manual",
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message || "Expense creation failed" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const { title, category, amount, note } = req.body || {};
    expense.title = title;
    expense.category = category;
    expense.amount = Number(amount || 0);
    expense.note = note || "";
    await expense.save();

    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message || "Update failed" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message || "Delete failed" });
  }
});

module.exports = router;
