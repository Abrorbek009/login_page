const express = require("express");

const router = express.Router();

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "0000";

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      user: {
        username: ADMIN_USER,
        role: "admin",
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid username or password",
  });
});

module.exports = router;
