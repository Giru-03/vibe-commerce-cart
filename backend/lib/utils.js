const mongoose = require('mongoose');
const cors = require('cors');

// Database connection with caching
let cached = global._mongoConnection || null;

async function connectToDatabase() {
  if (cached) return cached;

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI or MONGODB_URI environment variable is not set');
  
  const conn = await mongoose.connect(uri);
  cached = conn;
  global._mongoConnection = cached;
  return cached;
}

function resolveUserId(req) {
  return req.headers['x-user-id'] || req.body.userId || req.query.userId;
}

// CORS Configuration
function getCorsOptions() {
  const rawFrontends = 'http://localhost:5173,http://localhost:5174,https://vibe-commerce-cart-inky.vercel.app';
  const allowedOrigins = rawFrontends.split(',').map(s => s.trim()).filter(Boolean);

  return {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      
      if (origin && origin.match(/^https:\/\/.*\.vercel\.app$/)) {
        return callback(null, true);
      }
      
      return callback(new Error('CORS not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id']
  };
}

// Common middleware setup
function setupMiddleware(res) {
  // Apply CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-user-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Error handler
function handleError(res, error) {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
  const status = error.status || 500;
  res.status(status).json({ 
    error: error.message || 'Internal Server Error',
    type: error.name,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
}

// Handle preflight requests
function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setupMiddleware(res);
    res.status(204).end();
    return true;
  }
  return false;
}

module.exports = {
  connectToDatabase,
  resolveUserId,
  getCorsOptions,
  setupMiddleware,
  handleError,
  handlePreflight
};