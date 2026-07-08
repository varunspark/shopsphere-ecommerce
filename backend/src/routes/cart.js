const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/cart
router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate('cart.product');
    res.json(user.cart);
  } catch (err) {
    next(err);
  }
});

// POST /api/cart  { productId, quantity }
router.post('/', async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const user = await User.findById(req.userId);
    const existingItem = user.cart.find((item) => item.product.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }

    await user.save();
    await user.populate('cart.product');
    res.status(201).json(user.cart);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/:productId
router.delete('/:productId', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    user.cart = user.cart.filter((item) => item.product.toString() !== req.params.productId);
    await user.save();
    res.json(user.cart);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
