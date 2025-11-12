require('dotenv').config();
const { connectToDatabase, resolveUserId, handleError, handlePreflight, setupMiddleware } = require('../../lib/utils');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');

// Parse JSON body manually
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
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = await parseBody(req);
    const { name, email, cartItems } = body;

    if (!name || !email || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Name, email, and cart items are required' });
    }

    // Populate full product details from DB
    const populatedItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await Product.findById(item.productId).lean();
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
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
    
  } catch (error) {
    handleError(res, error);
  }
};