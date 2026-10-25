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

  describe('POST /api/auth/admin/login', () => {
    const adminData = {
      name: 'System Administrator',
      email: 'admin@example.com',
      password: 'adminPassword123'
    };

    beforeEach(async () => {
      // Create an admin user directly
      await User.create({
        ...adminData,
        role: 'ADMIN'
      });
      // Pre-register customer user
      await request(app).post('/api/auth/register').send(validRegisterData);
    });

    test('should allow admin to login successfully and return token with ADMIN role', async () => {
      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: adminData.email,
          password: adminData.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(adminData.email);
      expect(res.body.data.user.role).toBe('ADMIN');
    });

    test('should reject customer credentials with 403 FORBIDDEN from admin login', async () => {
      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: validRegisterData.email,
          password: validRegisterData.password
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toBe('Access denied. Administrator privileges required.');
    });

    test('should fail with wrong password for admin', async () => {
      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: adminData.email,
          password: 'incorrectPassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    test('should fail with non-existent admin email', async () => {
      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'nonexistentadmin@example.com',
          password: 'adminPassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    test('should reject missing email or password with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: adminData.email
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Unauthorized Admin Endpoint Access Enforcement', () => {
    let customerToken;
    let adminToken;

    beforeEach(async () => {
      const customerRes = await request(app).post('/api/auth/register').send(validRegisterData);
      customerToken = customerRes.body.data.token;

      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin2@example.com',
        password: 'adminPassword123',
        role: 'ADMIN'
      });
      const adminLoginRes = await request(app).post('/api/auth/admin/login').send({
        email: 'admin2@example.com',
        password: 'adminPassword123'
      });
      adminToken = adminLoginRes.body.data.token;
    });

    test('should reject customer token from accessing admin-only endpoint POST /api/categories with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Ethnic Wear', description: 'Traditional outfits' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toBe('Not authorized as an admin');
    });

    test('should reject unauthenticated request to admin endpoint with 401 AUTH_TOKEN_MISSING', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Ethnic Wear', description: 'Traditional outfits' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    test('should allow admin token to access admin-only endpoint POST /api/categories', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ethnic Wear', description: 'Traditional outfits' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Ethnic Wear');
    });
  });
});
