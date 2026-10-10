const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const generateToken = require('../src/utils/generateToken');

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

describe('User Profile APIs', () => {
  const validUserData = {
    name: 'Test Customer',
    email: 'test@example.com',
    password: 'password123',
    phone: '9876543210',
    role: 'CUSTOMER'
  };

  let token;
  let user;

  beforeEach(async () => {
    user = new User(validUserData);
    await user.save();
    token = generateToken(user._id, user.role);
  });

  describe('GET /api/users/profile', () => {
    test('should fetch logged in user profile', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUserData.email);
    });

    test('should reject without token', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });
  });

  describe('PATCH /api/users/profile', () => {
    test('should update name and phone', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          phone: '1112223334'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Updated Name');
      expect(res.body.data.user.phone).toBe('1112223334');
      
      // Email should be unchanged
      expect(res.body.data.user.email).toBe(validUserData.email);
    });

    test('should reject updating email or role', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'hacker@example.com',
          role: 'ADMIN'
        });

      // Based on our validation schema, unknown fields are rejected
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      
      // Confirm DB is unchanged
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.email).toBe(validUserData.email);
      expect(updatedUser.role).toBe('CUSTOMER');
    });
  });
});
