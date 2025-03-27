const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Store user info after Google OAuth
router.post("/login", async (req, res) => {
  const { googleId, name, email, profilePic } = req.body;

  try {
    let user = await User.findOne({ googleId });

    if (!user) {
      user = new User({ googleId, name, email, profilePic });
      await user.save();
    }

    res.json({ message: "User authenticated", user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
