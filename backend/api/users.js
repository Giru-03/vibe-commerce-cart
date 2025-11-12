require('dotenv').config();
const { connectToDatabase, handleError, handlePreflight, setupMiddleware } = require('../lib/utils');
const User = require('../models/User');

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

    const users = await User.find().select('name email -_id').lean();
    res.json(users);
    
  } catch (error) {
    handleError(res, error);
  }
};