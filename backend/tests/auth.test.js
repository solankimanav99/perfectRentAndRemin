const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth API', () => {
  const validRegisterData = {
    name: 'Test Customer',
    email: 'test@example.com',
    password: 'password123',
    phone: '9876543210'
  };

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully and return token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validRegisterData.email);
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    test('should enforce CUSTOMER role even if ADMIN is sent', async () => {
      const maliciousData = {
        ...validRegisterData,
        role: 'ADMIN' // Malicious intent
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(maliciousData);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('CUSTOMER'); // Backend must override
    });

    test('should not allow duplicate emails', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(validRegisterData);
      
      // Duplicate registration
      const res = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_EMAIL_EXISTS');
    });

    test('should validate missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' }); // Missing name, password

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Pre-register user for login tests
      await request(app).post('/api/auth/register').send(validRegisterData);
    });

    test('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validRegisterData.email,
          password: validRegisterData.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(validRegisterData.email);
    });

    test('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validRegisterData.email,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    test('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(validRegisterData);
      token = res.body.data.token;
    });

    test('should fetch current user data using token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validRegisterData.email);
    });

    test('should fail without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(validRegisterData);
      token = res.body.data.token;
    });

    test('should return logout success message', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
    });
  });
});
