require('dotenv').config();
const { connectToDatabase, handleError, handlePreflight, setupMiddleware } = require('../lib/utils');
const Product = require('../models/Product');

module.exports = async (req, res) => {
  try {
    // Handle preflight
    if (handlePreflight(req, res)) return;
    
    // Setup CORS
    setupMiddleware(res);
    
    // Connect to database
    await connectToDatabase();
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const products = await Product.find().lean(); // Use lean() for better performance
    res.json(products);
    
  } catch (error) {
    handleError(res, error);
  }
};