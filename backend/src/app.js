const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const client = require('prom-client');

const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // Prometheus default metrics for scraping
  client.collectDefaultMetrics();
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });

  // Health checks used by Docker/Kubernetes probes
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.get('/ready', (req, res) => res.status(200).json({ status: 'ready' }));

  app.use('/api/products', productRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/cart', cartRoutes);

  // 404 handler
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

  // Central error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}

module.exports = createApp;
