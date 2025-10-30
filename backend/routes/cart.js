const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// Helper to get userId from header, body, or query. Defaults to 'guest'.
function resolveUserId(req) {
  return req.headers['x-user-id'] || req.body.userId || req.query.userId || 'guest';
}

// GET all products
router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// POST add to cart
router.post('/cart', async (req, res, next) => {
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

// DELETE item from cart by cart item _id
router.delete('/cart/:id', async (req, res, next) => {
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

// PUT update quantity for a cart item
router.put('/cart/:id', async (req, res, next) => {
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

// GET cart
router.get('/cart', async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    let cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) cart = { items: [], total: 0 };
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// POST checkout
router.post('/checkout', async (req, res, next) => {
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

module.exports = router;