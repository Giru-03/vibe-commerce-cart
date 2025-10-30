const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET all users
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('name email -_id');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;