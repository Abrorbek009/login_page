const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ["sale", "purchase", "salary", "expense"] },
    amount: { type: Number, required: true },
    note: { type: String, trim: true, default: "" },
    sourceId: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

router.get("/", async (req, res) => {
  const transactions = await Transaction.find().sort({ createdAt: 1 });
  res.json(transactions);
});

router.get("/trend", async (req, res) => {
  const days = Number(req.query.days || 7);
  const months = Number(req.query.months || 6);
  const now = new Date();

  const dailyMap = new Map();
  const monthlyMap = new Map();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    dailyMap.set(date.toISOString().slice(0, 10), { sales: 0, profit: 0 });
  }

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    monthlyMap.set(date.toISOString().slice(0, 7), { sales: 0, profit: 0 });
  }

  const transactions = await Transaction.find().sort({ createdAt: 1 });

  transactions.forEach((tx) => {
    const dayKey = new Date(tx.createdAt).toISOString().slice(0, 10);
    const monthKey = new Date(tx.createdAt).toISOString().slice(0, 7);
    const signed = Number(tx.amount || 0);
    const profitDelta = tx.type === "sale" ? signed : -Math.abs(signed);

    if (dailyMap.has(dayKey)) {
      const current = dailyMap.get(dayKey);
      current.sales += tx.type === "sale" ? signed : 0;
      current.profit += profitDelta;
    }

    if (monthlyMap.has(monthKey)) {
      const current = monthlyMap.get(monthKey);
      current.sales += tx.type === "sale" ? signed : 0;
      current.profit += profitDelta;
    }
  });

  res.json({
    daily: Array.from(dailyMap.entries()).map(([date, values]) => ({
      label: date.slice(5).replace("-", "/"),
      date,
      sales: values.sales,
      profit: values.profit,
    })),
    monthly: Array.from(monthlyMap.entries()).map(([date, values]) => ({
      label: date.slice(5).replace("-", "/"),
      date,
      sales: values.sales,
      profit: values.profit,
    })),
  });
});

module.exports = { router, Transaction };
