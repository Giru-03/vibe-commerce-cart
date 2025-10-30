const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 }
});

const cartSchema = new mongoose.Schema({
  userId: { type: String, default: 'guest' }, // Mock user
  items: [cartItemSchema],
  total: { type: Number, default: 0 }
});

module.exports = mongoose.model('Cart', cartSchema);