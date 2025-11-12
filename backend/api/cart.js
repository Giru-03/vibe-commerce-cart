require('dotenv').config();
const { connectToDatabase, resolveUserId, handleError, handlePreflight, setupMiddleware } = require('../lib/utils');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper function to recalculate cart total
async function recalculateTotal(cart) {
  const populatedItems = await Promise.all(
    cart.items.map(async (item) => {
      const product = await Product.findById(item.productId).lean();
      return { ...item._doc, price: product ? product.price : 0 };
    })
  );
  return populatedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

// Parse JSON body manually for better performance
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

module.exports = async (req, res) => {
  try {
    // Handle preflight
    if (handlePreflight(req, res)) return;
    
    // Setup CORS
    setupMiddleware(res);
    
    // Connect to database
    await connectToDatabase();
    
    const userId = resolveUserId(req);

    if (req.method === 'GET') {
      // Get cart
      let cart = await Cart.findOne({ userId }).populate('items.productId').lean();
      if (!cart) cart = { items: [], total: 0 };
      res.json(cart);
      
    } else if (req.method === 'POST') {
      // Add to cart
      const body = await parseBody(req);
      const { productId, qty } = body;
      
      if (!productId || !qty || qty < 1) {
        return res.status(400).json({ error: 'Invalid productId or quantity' });
      }

      let cart = await Cart.findOne({ userId });
      if (!cart) cart = new Cart({ userId, items: [], total: 0 });

      const product = await Product.findById(productId).lean();
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += qty;
      } else {
        cart.items.push({ productId, quantity: qty });
      }

      cart.total = await recalculateTotal(cart);
      await cart.save();
      
      const result = await Cart.findById(cart._id).populate('items.productId');
      res.json(result);
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    handleError(res, error);
  }
};