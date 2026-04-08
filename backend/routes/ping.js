const express = require("express");
const router = express.Router();

// oddiy test uchun
router.get("/", (req, res) => {
  res.json({ message: "pong 🏓" });
});

module.exports = router;
