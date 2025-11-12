const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import models
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection with caching
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

// CORS Configuration
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

// Helper to get userId from header, body, or query. Defaults to 'guest'.
function resolveUserId(req) {
  return req.headers['x-user-id'] || req.body.userId || req.query.userId || 'guest';
}

// Routes
// GET all products
app.get('/api/products', async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// GET all users
app.get('/api/users', async (req, res, next) => {
  try {
    const users = await User.find().select('name email -_id');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// POST add to cart
app.post('/api/cart', async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const { productId, qty } = req.body;
    if (!productId || !qty || qty < 1) {
      const err = new Error('Invalid productId or quantity');
      err.status = 400;
      throw err;
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [], total: 0 });

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found');
      err.status = 404;
      throw err;
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += qty;
    } else {
      cart.items.push({ productId, quantity: qty });
    }

    // Recalculate total
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const p = await Product.findById(item.productId);
        return { ...item._doc, price: p ? p.price : 0 };
      })
    );

    cart.total = populatedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    await cart.save();
    const result = await cart.populate('items.productId');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET user's cart
app.get('/api/cart', async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    let cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) cart = { items: [], total: 0 };
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// PUT update quantity for a cart item
app.put('/api/cart/:id', async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const { quantity } = req.body;
    if (typeof quantity !== 'number' || quantity < 0) {
      const err = new Error('Quantity must be a non-negative number');
      err.status = 400;
      throw err;
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      const err = new Error('Cart not found');
      err.status = 404;
      throw err;
    }

    const item = cart.items.id(req.params.id);
    if (!item) {
      const err = new Error('Cart item not found');
      err.status = 404;
      throw err;
    }

    if (quantity === 0) {
      // remove item
      item.remove();
    } else {
      item.quantity = quantity;
    }

    // Recalculate total
    const populatedItems = await Promise.all(
      cart.items.map(async (it) => {
        const p = await Product.findById(it.productId);
        return { ...it._doc, price: p ? p.price : 0 };
      })
    );
    cart.total = populatedItems.reduce((sum, it) => sum + it.quantity * it.price, 0);

    await cart.save();
    const result = await cart.populate('items.productId');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE item from cart by cart item _id
app.delete('/api/cart/:id', async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      const err = new Error('Cart not found');
      err.status = 404;
      throw err;
    }

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.id);

    // Recalculate total
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const p = await Product.findById(item.productId);
        return { ...item._doc, price: p ? p.price : 0 };
      })
    );
    cart.total = populatedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    await cart.save();
    const result = await cart.populate('items.productId');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST checkout
app.post('/api/checkout', async (req, res, next) => {
  try {
    const { name, email, cartItems } = req.body;

    if (!name || !email || !Array.isArray(cartItems) || cartItems.length === 0) {
      const err = new Error('Name, email, and cart items are required');
      err.status = 400;
      throw err;
    }

    // Populate full product details from DB
    const populatedItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
          const err = new Error(`Product not found: ${item.productId}`);
          err.status = 400;
          throw err;
        }
        return {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: item.quantity
        };
      })
    );

    // Calculate total safely
    const total = populatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const receipt = {
      orderId: `ORD-${Date.now()}`,
      customer: { name, email },
      items: populatedItems,
      total: total,
      timestamp: new Date().toISOString(),
      status: 'confirmed'
    };

    // Clear cart for user
    const userId = resolveUserId(req);
    await Cart.deleteOne({ userId });

    res.json(receipt);
  } catch (err) {
    next(err);
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('API is running successfully! 👍');
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// For Vercel serverless functions
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    try {
      await connectToDatabase();
      return app(req, res);
    } catch (err) {
      console.error('API error', err);
      res.statusCode = err.status || 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
    }
  };
} else {
  // For local development
  connectToDatabase()
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('Failed to connect to MongoDB:', err));
}

module.exports = app;