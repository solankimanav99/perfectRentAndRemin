const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Category = require('../src/models/Category');
const Clothing = require('../src/models/Clothing');

let mongoServer;
let categoryId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const cat = await Category.create({ name: 'Test Category' });
  categoryId = cat._id.toString();
});

afterEach(async () => {
  await Category.deleteMany({});
  await Clothing.deleteMany({});
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
    it('should create clothing successfully', async () => {
      const res = await request(app)
        .post('/api/clothing')
        .set('X-Dev-Role', 'ADMIN')
        .send(getValidClothing());
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Item');
      expect(res.body.data.availableQuantity).toBe(5);
    });

    it('should reject invalid condition enum', async () => {
      const item = getValidClothing();
      item.condition = 'DAMAGED'; // DAMAGED is not allowed in Clothing
      const res = await request(app)
        .post('/api/clothing')
        .set('X-Dev-Role', 'ADMIN')
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
        .set('X-Dev-Role', 'ADMIN')
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
        .set('X-Dev-Role', 'ADMIN')
        .send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.data.quantity).toBe(10);
    });
  });

  describe('DELETE /api/clothing/:id', () => {
    it('should return 501 for deferred deletion', async () => {
      const item = await Clothing.create(getValidClothing());
      const res = await request(app)
        .delete(`/api/clothing/${item._id}`)
        .set('X-Dev-Role', 'ADMIN');
      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
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
