const express = require("express");

const router = express.Router();

const USERS = {
  admin: {
    username: "admin",
    role: "admin",
    password: "0000",
  },
  sotuv: {
    username: "sotuv",
    role: "sotuv",
    password: "0000",
  },
};

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const user = USERS[normalizedUsername];

  if (user && String(password || "") === user.password) {
    return res.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid username or password",
  });
});

module.exports = router;
