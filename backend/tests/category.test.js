const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Category = require('../src/models/Category');
const Clothing = require('../src/models/Clothing');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Category.deleteMany({});
  await Clothing.deleteMany({});
});

describe('Category API', () => {
  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      await Category.create({ name: 'Sherwani' });
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Sherwani');
    });
  });

  describe('POST /api/categories', () => {
    it('should create a category with dev admin header', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('X-Dev-Role', 'ADMIN')
        .send({ name: 'Suit', description: 'Formal suits' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Suit');
    });

    it('should reject without dev admin header', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Suit' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject duplicate names', async () => {
      await Category.create({ name: 'Suit' });
      const res = await request(app)
        .post('/api/categories')
        .set('X-Dev-Role', 'ADMIN')
        .send({ name: 'Suit' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CATEGORY_EXISTS');
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update a category when both name and description are provided', async () => {
      const cat = await Category.create({ name: 'Suit' });
      const res = await request(app)
        .put(`/api/categories/${cat._id}`)
        .set('X-Dev-Role', 'ADMIN')
        .send({ name: 'Suit Updated', description: 'Updated desc' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Suit Updated');
    });

    it('should reject update if description is missing', async () => {
      const cat = await Category.create({ name: 'Suit' });
      const res = await request(app)
        .put(`/api/categories/${cat._id}`)
        .set('X-Dev-Role', 'ADMIN')
        .send({ name: 'Suit Updated' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete an empty category', async () => {
      const cat = await Category.create({ name: 'Suit' });
      const res = await request(app)
        .delete(`/api/categories/${cat._id}`)
        .set('X-Dev-Role', 'ADMIN');
      expect(res.status).toBe(200);
      const check = await Category.findById(cat._id);
      expect(check).toBeNull();
    });

    it('should reject deletion if referenced by clothing', async () => {
      const cat = await Category.create({ name: 'Suit' });
      await Clothing.create({
        name: 'Blue Suit',
        categoryId: cat._id,
        description: 'Nice suit',
        size: 'M',
        color: 'Blue',
        rentalPrice: 100,
        securityDeposit: 500,
        quantity: 1,
        condition: 'GOOD',
        availabilityStatus: 'AVAILABLE'
      });
      const res = await request(app)
        .delete(`/api/categories/${cat._id}`)
        .set('X-Dev-Role', 'ADMIN');
      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/referenced by clothing/);
    });
  });
});
