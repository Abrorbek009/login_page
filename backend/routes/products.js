const express = require("express");
const mongoose = require("mongoose");
const { Transaction } = require("./reports");

const router = express.Router();

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sold: { type: Number, required: true, min: 0, default: 0 },
    purchased: { type: Number, required: true, min: 0, default: 0 },
    source: { type: String, trim: true, default: "manual" },
  },
  { timestamps: true },
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

router.get("/", async (req, res) => {
  const products = await Product.find().sort({ updatedAt: -1 });
  res.json(products);
});

router.delete("/demo/all", async (req, res) => {
  const result = await Product.deleteMany({ source: "demo" });
  res.json({ success: true, deletedCount: result.deletedCount || 0 });
});

router.post("/", async (req, res) => {
  try {
    const { name, sku, price, stock } = req.body || {};
    const product = await Product.create({
      name,
      sku,
      price: Number(price),
      stock: Number(stock || 0),
      sold: 0,
      purchased: Number(stock || 0),
      source: req.body?.source || "manual",
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Product creation failed",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { name, sku, price, stock } = req.body || {};
    product.name = name;
    product.sku = sku;
    product.price = Number(price);
    product.stock = Number(stock || 0);
    product.purchased = Math.max(product.purchased, product.stock);
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message || "Update failed" });
  }
});

router.patch("/:id/purchase", async (req, res) => {
  try {
    const amount = Math.max(1, Number(req.body?.amount || 1));
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.stock += amount;
    product.purchased += amount;
    await product.save();
    await Transaction.create({
      type: "purchase",
      amount: Number(product.price || 0) * amount,
      note: `${product.name} purchase`,
      sourceId: product._id.toString(),
    });

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message || "Purchase failed" });
  }
});

router.patch("/:id/sell", async (req, res) => {
  try {
    const amount = Math.max(1, Number(req.body?.amount || 1));
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < amount) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    product.stock -= amount;
    product.sold += amount;
    await product.save();
    await Transaction.create({
      type: "sale",
      amount: Number(product.price || 0) * amount,
      note: `${product.name} sale`,
      sourceId: product._id.toString(),
    });

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message || "Sell failed" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message || "Delete failed" });
  }
});

module.exports = router;
