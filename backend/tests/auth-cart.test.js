const request = require('supertest');
require('./setup');
const createApp = require('../src/app');

const app = createApp();

async function registerUser() {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  });
  return res.body.token;
}

describe('Auth API', () => {
  test('POST /api/auth/register creates a user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'securePass1',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jane@example.com');
  });

  test('POST /api/auth/register rejects duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Jane',
      email: 'dup@example.com',
      password: 'pass12345',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane 2',
      email: 'dup@example.com',
      password: 'pass12345',
    });

    expect(res.status).toBe(409);
  });

  test('POST /api/auth/login succeeds with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'mySecret1',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'mySecret1',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login rejects wrong password', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User 2',
      email: 'login2@example.com',
      password: 'mySecret1',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login2@example.com',
      password: 'wrongPassword',
    });

    expect(res.status).toBe(401);
  });
});

describe('Cart API', () => {
  test('rejects unauthenticated cart access', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  test('adds a product to the cart for an authenticated user', async () => {
    const token = await registerUser();

    const product = await request(app).post('/api/products').send({
      name: 'Monitor',
      price: 12999,
      category: 'Electronics',
      stock: 10,
    });

    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.body._id, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body[0].quantity).toBe(2);
  });
});
