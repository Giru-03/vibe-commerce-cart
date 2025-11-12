const express = require('express');
const cors = require('cors');

const cartRoutes = require('./routes/cart');
const userRoutes = require('./routes/users');

function createApp() {
  const app = express();

    // Support a comma-separated list of allowed frontend origins via env var.
    // Example: FRONTEND_URLS="https://app.example.com,https://staging.example.com"
    const rawFrontends = 'http://localhost:5173,https://vibe-commerce-cart-inky.vercel.app';
    const allowedOrigins = rawFrontends.split(',').map(s => s.trim()).filter(Boolean);

    const corsOptions = {
      origin: function(origin, callback) {
        // allow requests with no origin (e.g., curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        
        // For development/testing, also allow vercel.app subdomains
        if (origin && origin.match(/^https:\/\/.*\.vercel\.app$/)) {
          return callback(null, true);
        }
        
        // not allowed
        return callback(new Error('CORS not allowed'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id']
    };

    app.use(cors(corsOptions));
    // Ensure preflight requests are handled
    app.options('*', cors(corsOptions));

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
