const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const cartRoutes = require('./routes/cart');
const userRoutes = require('./routes/users');

const app = require('./app');
const { connectToDatabase } = require('./db');

const PORT = process.env.PORT || 5000;

connectToDatabase()
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('Failed to connect to MongoDB:', err));

module.exports = app;