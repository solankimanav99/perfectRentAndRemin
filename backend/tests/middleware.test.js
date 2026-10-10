const request = require('supertest');
const express = require('express');
const { protect, admin } = require('../src/middleware/auth.middleware');
const { ERROR_CODES } = require('../src/utils/constants');

// Create a dummy Express app for testing middleware independently
const app = express();
app.use(express.json());

// Dummy routes to test middleware behavior
app.get('/api/test/protect', (req, res, next) => {
  // Mock req.user normally attached by protect
  // We'll skip real JWT verification and just simulate it by mounting admin after a dummy protect
  res.status(200).json({ success: true, message: 'Protected route' });
});

app.get('/api/test/admin', 
  (req, res, next) => {
    // Inject mock user based on headers
    if (req.headers['x-mock-role']) {
      req.user = { role: req.headers['x-mock-role'] };
    }
    next();
  }, 
  admin, 
  (req, res) => {
    res.status(200).json({ success: true, message: 'Admin route accessed' });
  }
);

describe('Auth & Admin Middleware', () => {
  
  describe('admin middleware', () => {
    test('should allow access if user is ADMIN', async () => {
      const res = await request(app)
        .get('/api/test/admin')
        .set('x-mock-role', 'ADMIN');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return 403 FORBIDDEN if user is CUSTOMER', async () => {
      const res = await request(app)
        .get('/api/test/admin')
        .set('x-mock-role', 'CUSTOMER');

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(res.body.error.message).toBe('Not authorized as an admin');
    });

    test('should return 403 FORBIDDEN if user role is missing', async () => {
      const res = await request(app).get('/api/test/admin');

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });
});
