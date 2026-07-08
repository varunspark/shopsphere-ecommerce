require('dotenv').config();
const createApp = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function start() {
  try {
    await connectDB(MONGO_URI);
    console.log('Connected to MongoDB');

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`E-commerce API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
