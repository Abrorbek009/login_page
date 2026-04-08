const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const employeeSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    phone: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    lastPaidAt: { type: Date, default: null },
    totalPaid: { type: Number, default: 0, min: 0 },
    source: { type: String, trim: true, default: "manual" },
  },
  { timestamps: true },
);

const Employee =
  mongoose.models.Employee || mongoose.model("Employee", employeeSchema);

router.get("/", async (req, res) => {
  const employees = await Employee.find().sort({ updatedAt: -1 });
  res.json(employees);
});

router.delete("/demo/all", async (req, res) => {
  const result = await Employee.deleteMany({ source: "demo" });
  res.json({ success: true, deletedCount: result.deletedCount || 0 });
});

router.post("/", async (req, res) => {
  try {
    const employee = await Employee.create({
      fullName: req.body?.fullName,
      position: req.body?.position,
      salary: Number(req.body?.salary || 0),
      phone: req.body?.phone || "",
      status: req.body?.status || "active",
      source: req.body?.source || "manual",
    });

    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message || "Employee creation failed" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const { fullName, position, salary, phone, status } = req.body || {};
    employee.fullName = fullName;
    employee.position = position;
    employee.salary = Number(salary || 0);
    employee.phone = phone || "";
    employee.status = status || "active";
    await employee.save();

    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message || "Update failed" });
  }
});

router.patch("/:id/pay", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const paidAmount = Number(req.body?.amount || employee.salary);
    employee.lastPaidAt = new Date();
    employee.totalPaid += paidAmount;
    await employee.save();

    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message || "Salary payment failed" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message || "Delete failed" });
  }
});

module.exports = router;
