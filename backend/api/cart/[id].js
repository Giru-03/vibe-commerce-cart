require('dotenv').config();
const { connectToDatabase, resolveUserId, handleError, handlePreflight, setupMiddleware } = require('../../lib/utils');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');

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

module.exports = async (req, res) => {
  try {
    // Handle preflight
    if (handlePreflight(req, res)) return;
    
    // Setup CORS
    setupMiddleware(res);
    
    // Connect to database
    await connectToDatabase();
    
    const userId = resolveUserId(req);
    // Extract ID from query params or URL
    const itemId = req.query.id || req.url.split('/').pop().split('?')[0];

    if (req.method === 'PUT') {
      // Update cart item quantity
      const body = await parseBody(req);
      const { quantity } = body;
      
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ error: 'Quantity must be a non-negative number' });
      }

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }

      const item = cart.items.id(itemId);
      if (!item) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      if (quantity === 0) {
        item.remove();
      } else {
        item.quantity = quantity;
      }

      cart.total = await recalculateTotal(cart);
      await cart.save();
      
      const result = await Cart.findById(cart._id).populate('items.productId');
      res.json(result);
      
    } else if (req.method === 'DELETE') {
      // Remove cart item
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }

      cart.items = cart.items.filter(item => item._id.toString() !== itemId);
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