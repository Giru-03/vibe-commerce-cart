const express = require('express');
const cors = require('cors');

const cartRoutes = require('./routes/cart');
const userRoutes = require('./routes/users');

function createApp() {
  const app = express();

  const frontendOrigin = process.env.FRONTEND_URL || 'https://vibe-commerce-cart-inky.vercel.app/';
  app.use(cors({
    origin: frontendOrigin,
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

  app.get('/', (req, res) => {
    res.send('API is running successfully! 👍');
  });

  return app;
}

module.exports = createApp();
