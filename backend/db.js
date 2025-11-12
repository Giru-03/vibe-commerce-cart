const mongoose = require('mongoose');

let cached = global._mongoConnection || null;

async function connectToDatabase() {
  if (cached) return cached;

  // Accept either MONGO_URI (preferred) or MONGODB_URI (existing .env uses this)
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI or MONGODB_URI environment variable is not set');
  if (!process.env.MONGO_URI && process.env.MONGODB_URI) {
    console.warn('Using MONGODB_URI environment variable; consider renaming to MONGO_URI for consistency');
  }

  // Connect and cache the connection for reuse across warm invocations
  const conn = await mongoose.connect(uri);
  cached = conn;
  global._mongoConnection = cached;
  return cached;
}

module.exports = { connectToDatabase };
