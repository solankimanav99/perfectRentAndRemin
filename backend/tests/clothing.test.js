const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Category = require('../src/models/Category');
const Clothing = require('../src/models/Clothing');
const User = require('../src/models/User');
const Booking = require('../src/models/Booking');
const Return = require('../src/models/Return');
const { ERROR_CODES } = require('../src/utils/constants');
const generateToken = require('../src/utils/generateToken');

let mongoServer;
let categoryId;
let adminToken;
let customerToken;
let customerUserId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const cat = await Category.create({ name: 'Test Category' });
  categoryId = cat._id.toString();

  const adminUser = await User.create({
    name: 'Admin',
    email: 'admin@clothing.com',
    password: 'password123',
    phone: '1111111111',
    role: 'ADMIN'
  });
  adminToken = generateToken(adminUser._id, adminUser.role);

  const customerUser = await User.create({
    name: 'Customer',
    email: 'customer@clothing.com',
    password: 'password123',
    phone: '2222222222',
    role: 'CUSTOMER'
  });
  customerUserId = customerUser._id;
  customerToken = generateToken(customerUser._id, customerUser.role);
});

afterEach(async () => {
  await Return.deleteMany({});
  await Booking.deleteMany({});
  await Clothing.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});
});

const getValidClothing = () => ({
  name: 'Test Item',
  categoryId,
  description: 'Test desc',
  size: 'M',
  color: 'Red',
  rentalPrice: 100,
  securityDeposit: 500,
  quantity: 5,
  condition: 'GOOD',
  availabilityStatus: 'AVAILABLE'
});

describe('Clothing API', () => {
  describe('POST /api/clothing', () => {
    it('should create clothing successfully with admin token', async () => {
      const res = await request(app)
        .post('/api/clothing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(getValidClothing());
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Item');
      expect(res.body.data.availableQuantity).toBe(5);
    });

    it('should reject without token', async () => {
      const res = await request(app)
        .post('/api/clothing')
        .send(getValidClothing());
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should reject with customer token', async () => {
      const res = await request(app)
        .post('/api/clothing')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(getValidClothing());
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject invalid condition enum', async () => {
      const item = getValidClothing();
      item.condition = 'DAMAGED'; // DAMAGED is not allowed in Clothing
      const res = await request(app)
        .post('/api/clothing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(item);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/clothing', () => {
    it('should return 501 when date filters are used', async () => {
      const res = await request(app).get('/api/clothing?startDate=2026-10-20&endDate=2026-10-22');
      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
    });

    it('should filter correctly without dates', async () => {
      await Clothing.create(getValidClothing());
      const res = await request(app).get('/api/clothing?color=Red');
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.pagination.page).toBe(1);
    });
  });

  describe('PUT /api/clothing/:id', () => {
    it('should return 501 when quantity is reduced', async () => {
      const item = await Clothing.create(getValidClothing());
      const updateData = getValidClothing();
      updateData.quantity = 2; // reduce from 5 to 2
      const res = await request(app)
        .put(`/api/clothing/${item._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
    });

    it('should update successfully when quantity is increased', async () => {
      const item = await Clothing.create(getValidClothing());
      const updateData = getValidClothing();
      updateData.quantity = 10;
      const res = await request(app)
        .put(`/api/clothing/${item._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.data.quantity).toBe(10);
    });

    it('should strip unknown read-only metadata without throwing validation error', async () => {
      const item = await Clothing.create(getValidClothing());
      const updateData = {
        ...getValidClothing(),
        id: item._id.toString(),
        category: { id: categoryId, name: 'Test Category' },
        availableQuantity: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const res = await request(app)
        .put(`/api/clothing/${item._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/clothing/:id/status (Deactivate / Activate)', () => {
    it('should allow admin to deactivate an item (UNAVAILABLE)', async () => {
      const item = await Clothing.create(getValidClothing());
      const res = await request(app)
        .patch(`/api/clothing/${item._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ availabilityStatus: 'UNAVAILABLE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.availabilityStatus).toBe('UNAVAILABLE');

      const updated = await Clothing.findById(item._id);
      expect(updated.availabilityStatus).toBe('UNAVAILABLE');
    });

    it('should allow admin to reactivate an item (AVAILABLE)', async () => {
      const item = await Clothing.create({
        ...getValidClothing(),
        availabilityStatus: 'UNAVAILABLE'
      });
      const res = await request(app)
        .patch(`/api/clothing/${item._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ availabilityStatus: 'AVAILABLE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.availabilityStatus).toBe('AVAILABLE');

      const updated = await Clothing.findById(item._id);
      expect(updated.availabilityStatus).toBe('AVAILABLE');
    });

    it('should forbid customer from updating clothing status with 403', async () => {
      const item = await Clothing.create(getValidClothing());
      const res = await request(app)
        .patch(`/api/clothing/${item._id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ availabilityStatus: 'UNAVAILABLE' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject unauthenticated request with 401', async () => {
      const item = await Clothing.create(getValidClothing());
      const res = await request(app)
        .patch(`/api/clothing/${item._id}/status`)
        .send({ availabilityStatus: 'UNAVAILABLE' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should reject invalid status with 400 VALIDATION_ERROR', async () => {
      const item = await Clothing.create(getValidClothing());
      const res = await request(app)
        .patch(`/api/clothing/${item._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ availabilityStatus: 'NON_EXISTENT_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return 404 for non-existent clothing item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/clothing/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ availabilityStatus: 'UNAVAILABLE' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ERROR_CODES.CLOTHING_NOT_FOUND);
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request(app)
        .patch('/api/clothing/invalid-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ availabilityStatus: 'UNAVAILABLE' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.INVALID_ID);
    });

    it('should prevent booking a deactivated item', async () => {
      const item = await Clothing.create({
        ...getValidClothing(),
        availabilityStatus: 'UNAVAILABLE'
      });

      const futureStart = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
      const futureEnd = new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          clothingId: item._id.toString(),
          rentalStartDate: futureStart,
          returnDate: futureEnd,
          quantity: 1
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.CLOTHING_UNAVAILABLE);
    });
  });

  describe('DELETE /api/clothing/:id', () => {
    it('should permanently delete clothing when no bookings or returns exist', async () => {
      const item = await Clothing.create(getValidClothing());
      const res = await request(app)
        .delete(`/api/clothing/${item._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Clothing deleted successfully.');

      const inDb = await Clothing.findById(item._id);
      expect(inDb).toBeNull();
    });

    it('should reject deletion with 409 CLOTHING_HAS_ACTIVE_BOOKINGS when active bookings exist', async () => {
      const item = await Clothing.create(getValidClothing());

      // Create an active (PENDING) booking
      const futureStart = new Date(Date.now() + 86400000 * 5);
      const futureEnd = new Date(Date.now() + 86400000 * 7);

      await Booking.create({
        customerId: customerUserId,
        clothingId: item._id,
        rentalStartDate: futureStart,
        returnDate: futureEnd,
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 200,
        securityDeposit: 500,
        totalAmount: 700,
        status: 'PENDING'
      });

      const res = await request(app)
        .delete(`/api/clothing/${item._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.CLOTHING_HAS_ACTIVE_BOOKINGS);

      // Verify item remains in database and untouched
      const inDb = await Clothing.findById(item._id);
      expect(inDb).not.toBeNull();
      expect(inDb.availabilityStatus).toBe('AVAILABLE');
    });

    it('should preserve record and mark UNAVAILABLE when historical bookings exist (e.g. COMPLETED)', async () => {
      const item = await Clothing.create(getValidClothing());

      // Create historical COMPLETED booking
      const pastStart = new Date(Date.now() - 86400000 * 10);
      const pastEnd = new Date(Date.now() - 86400000 * 7);

      await Booking.create({
        customerId: customerUserId,
        clothingId: item._id,
        rentalStartDate: pastStart,
        returnDate: pastEnd,
        quantity: 1,
        rentalDuration: 3,
        rentalAmount: 300,
        securityDeposit: 500,
        totalAmount: 800,
        status: 'COMPLETED'
      });

      const res = await request(app)
        .delete(`/api/clothing/${item._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Clothing marked as unavailable.');
      expect(res.body.data.availabilityStatus).toBe('UNAVAILABLE');

      // Verify item is preserved in database with UNAVAILABLE status
      const inDb = await Clothing.findById(item._id);
      expect(inDb).not.toBeNull();
      expect(inDb.availabilityStatus).toBe('UNAVAILABLE');
    });

    it('should preserve record and mark UNAVAILABLE when return records exist', async () => {
      const item = await Clothing.create(getValidClothing());

      const pastStart = new Date(Date.now() - 86400000 * 10);
      const pastEnd = new Date(Date.now() - 86400000 * 7);

      const booking = await Booking.create({
        customerId: customerUserId,
        clothingId: item._id,
        rentalStartDate: pastStart,
        returnDate: pastEnd,
        quantity: 1,
        rentalDuration: 3,
        rentalAmount: 300,
        securityDeposit: 500,
        totalAmount: 800,
        status: 'RETURNED'
      });

      await Return.create({
        bookingId: booking._id,
        clothingId: item._id,
        customerId: customerUserId,
        expectedReturnDate: pastEnd,
        actualReturnDate: pastEnd,
        condition: 'GOOD',
        status: 'RETURNED'
      });

      const res = await request(app)
        .delete(`/api/clothing/${item._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Clothing marked as unavailable.');

      const inDb = await Clothing.findById(item._id);
      expect(inDb).not.toBeNull();
      expect(inDb.availabilityStatus).toBe('UNAVAILABLE');
    });

    it('should reject customer delete request with 403 FORBIDDEN', async () => {
      const item = await Clothing.create(getValidClothing());
      const res = await request(app)
        .delete(`/api/clothing/${item._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject unauthenticated delete request with 401 AUTH_TOKEN_MISSING', async () => {
      const item = await Clothing.create(getValidClothing());
      const res = await request(app).delete(`/api/clothing/${item._id}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should return 404 for non-existent item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/clothing/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ERROR_CODES.CLOTHING_NOT_FOUND);
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request(app)
        .delete('/api/clothing/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.INVALID_ID);
    });
  });

  describe('GET /api/clothing/:id/availability', () => {
    it('should return 501 for deferred availability check', async () => {
      const item = await Clothing.create(getValidClothing());
      const res = await request(app).get(`/api/clothing/${item._id}/availability`);
      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
    });
  });
});
