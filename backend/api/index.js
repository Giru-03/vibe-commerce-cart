const app = require('../app');
const { connectToDatabase } = require('../db');

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    // Express apps are callable: app(req, res)
    return app(req, res);
  } catch (err) {
    console.error('API error', err);
    res.statusCode = err.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
};
