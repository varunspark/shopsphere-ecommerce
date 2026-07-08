const request = require('supertest');
require('./setup');
const createApp = require('../src/app');

const app = createApp();

describe('Products API', () => {
  test('POST /api/products creates a product', async () => {
    const res = await request(app).post('/api/products').send({
      name: 'Wireless Mouse',
      price: 799,
      category: 'Electronics',
      stock: 50,
    });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Wireless Mouse');
    expect(res.body._id).toBeDefined();
  });

  test('GET /api/products returns list of products', async () => {
    await request(app).post('/api/products').send({
      name: 'Keyboard',
      price: 1499,
      category: 'Electronics',
      stock: 20,
    });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  test('GET /api/products/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/products/64b7f9f1f1a2b3c4d5e6f7a8');
    expect(res.status).toBe(404);
  });

  test('DELETE /api/products/:id removes a product', async () => {
    const created = await request(app).post('/api/products').send({
      name: 'USB Cable',
      price: 199,
      category: 'Accessories',
      stock: 100,
    });

    const res = await request(app).delete(`/api/products/${created.body._id}`);
    expect(res.status).toBe(200);

    const check = await request(app).get(`/api/products/${created.body._id}`);
    expect(check.status).toBe(404);
  });
});
