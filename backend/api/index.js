require('dotenv').config();
const { handlePreflight, setupMiddleware } = require('../lib/utils');

module.exports = async (req, res) => {
  try {
    // Handle preflight
    if (handlePreflight(req, res)) return;
    
    // Setup CORS
    setupMiddleware(res);
    
    res.json({
      message: 'Vibe Commerce API is running! 🚀',
      version: '2.0',
      endpoints: {
        products: '/api/products',
        users: '/api/users',
        cart: '/api/cart',
        checkout: '/api/checkout'
      },
      status: 'healthy'
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};