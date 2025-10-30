const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: 'https://via.placeholder.com/300' }
});

module.exports = mongoose.model('Product', productSchema);