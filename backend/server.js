const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const cartRoutes = require('./routes/cart');
const userRoutes = require('./routes/users');

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',  // Vite default
  credentials: true
}));
app.use(express.json());

app.use('/api', cartRoutes);
app.use('/api', userRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));