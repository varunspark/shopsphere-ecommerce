/**
 * Seeds the database with sample products so the storefront isn't empty
 * on first run.
 *
 * Usage:
 *   MONGO_URI=mongodb://localhost:27017/ecommerce node scripts/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

const sampleProducts = [
  { name: 'Wireless Mouse', price: 799, category: 'Electronics', stock: 50 },
  { name: 'Mechanical Keyboard', price: 3499, category: 'Electronics', stock: 30 },
  { name: '27" Monitor', price: 15999, category: 'Electronics', stock: 12 },
  { name: 'USB-C Hub', price: 1899, category: 'Accessories', stock: 40 },
  { name: 'Laptop Stand', price: 1299, category: 'Accessories', stock: 25 },
  { name: 'Noise Cancelling Headphones', price: 8999, category: 'Audio', stock: 18 },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  await Product.deleteMany({});
  await Product.insertMany(sampleProducts);
  console.log(`Seeded ${sampleProducts.length} products.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
