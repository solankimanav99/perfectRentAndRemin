const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Return = require('../src/models/Return');
const generateToken = require('../src/utils/generateToken');
const { ERROR_CODES } = require('../src/utils/constants');

let replSet;
let customerUser;
let customerToken;
let otherCustomerUser;
let otherCustomerToken;
let adminUser;
let adminToken;
let MockBooking;

beforeAll(async () => {
  // Use MongoMemoryReplSet for transactions
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());

  const mockBookingSchema = new mongoose.Schema(
    {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      clothingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clothing', required: true },
      rentalStartDate: { type: Date, required: true },
      returnDate: { type: Date, required: true },
      quantity: { type: Number, required: true },
      rentalDuration: { type: Number, required: true },
      rentalAmount: { type: Number, required: true },
      securityDeposit: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'COMPLETED', 'CANCELLED', 'OVERDUE'],
        default: 'PICKED_UP'
      }
    },
    { timestamps: true }
  );

  MockBooking = mongoose.models.Booking || mongoose.model('Booking', mockBookingSchema);
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Return.deleteMany({});
  await MockBooking.deleteMany({});

  customerUser = await User.create({
    name: 'Customer One',
    email: 'cust1@test.com',
    password: 'password123',
    role: 'CUSTOMER'
  });
  customerToken = generateToken(customerUser._id, customerUser.role);

  otherCustomerUser = await User.create({
    name: 'Customer Two',
    email: 'cust2@test.com',
    password: 'password123',
    role: 'CUSTOMER'
  });
  otherCustomerToken = generateToken(otherCustomerUser._id, otherCustomerUser.role);

  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'ADMIN'
  });
  adminToken = generateToken(adminUser._id, adminUser.role);
});

describe('Return API Integration Tests', () => {
  describe('POST /api/returns (ADMIN only)', () => {
    it('should allow admin to process a return and transition booking to RETURNED atomically', async () => {
      const booking = await MockBooking.create({
        customerId: customerUser._id,
        clothingId: new mongoose.Types.ObjectId(),
        rentalStartDate: new Date('2026-10-20'),
        returnDate: new Date('2026-10-22'),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 2000,
        securityDeposit: 3000,
        totalAmount: 5000,
        status: 'PICKED_UP'
      });

      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId: booking._id.toString(),
          actualReturnDate: '2026-10-24',
          condition: 'GOOD'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lateDays).toBe(2);
      expect(res.body.data.fine).toBe(200); // 2 days * 100
      expect(res.body.data.status).toBe('LATE');

      // Verify atomic booking status transition to RETURNED
      const updatedBooking = await MockBooking.findById(booking._id);
      expect(updatedBooking.status).toBe('RETURNED');
    });

    it('should set return status to DAMAGED if condition is DAMAGED', async () => {
      const booking = await MockBooking.create({
        customerId: customerUser._id,
        clothingId: new mongoose.Types.ObjectId(),
        rentalStartDate: new Date('2026-10-20'),
        returnDate: new Date('2026-10-22'),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 2000,
        securityDeposit: 3000,
        totalAmount: 5000,
        status: 'PICKED_UP'
      });

      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId: booking._id.toString(),
          actualReturnDate: '2026-10-22',
          condition: 'DAMAGED'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('DAMAGED');
    });

    it('should forbid customer from calling POST /api/returns with 403 FORBIDDEN', async () => {
      const booking = await MockBooking.create({
        customerId: customerUser._id,
        clothingId: new mongoose.Types.ObjectId(),
        rentalStartDate: new Date('2026-10-20'),
        returnDate: new Date('2026-10-22'),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 2000,
        securityDeposit: 3000,
        totalAmount: 5000,
        status: 'PICKED_UP'
      });

      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          actualReturnDate: '2026-10-22',
          condition: 'GOOD'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should reject return if booking is not PICKED_UP or OVERDUE with 400 RETURN_INVALID_BOOKING', async () => {
      const booking = await MockBooking.create({
        customerId: customerUser._id,
        clothingId: new mongoose.Types.ObjectId(),
        rentalStartDate: new Date('2026-10-20'),
        returnDate: new Date('2026-10-22'),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 2000,
        securityDeposit: 3000,
        totalAmount: 5000,
        status: 'CONFIRMED'
      });

      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId: booking._id.toString(),
          actualReturnDate: '2026-10-22',
          condition: 'GOOD'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.RETURN_INVALID_BOOKING);
    });

    it('should reject duplicate return creation with 400 RETURN_ALREADY_COMPLETED', async () => {
      const booking = await MockBooking.create({
        customerId: customerUser._id,
        clothingId: new mongoose.Types.ObjectId(),
        rentalStartDate: new Date('2026-10-20'),
        returnDate: new Date('2026-10-22'),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 2000,
        securityDeposit: 3000,
        totalAmount: 5000,
        status: 'PICKED_UP'
      });

      // First return
      await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId: booking._id.toString(),
          actualReturnDate: '2026-10-22',
          condition: 'GOOD'
        });

      // Second return
      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId: booking._id.toString(),
          actualReturnDate: '2026-10-22',
          condition: 'GOOD'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.RETURN_ALREADY_COMPLETED);
    });
  });

  describe('GET /api/returns and GET /api/returns/:id visibility masking', () => {
    it('should mask damageCharge and depositRefunded as null for customer when settled is false', async () => {
      const returnDoc = await Return.create({
        bookingId: new mongoose.Types.ObjectId(),
        clothingId: new mongoose.Types.ObjectId(),
        customerId: customerUser._id,
        expectedReturnDate: new Date('2026-10-22'),
        actualReturnDate: new Date('2026-10-24'),
        lateDays: 2,
        fine: 200,
        condition: 'GOOD',
        status: 'LATE',
        damageCharge: 500, // Provisional draft
        depositRefunded: 2500,
        finePaid: false,
        settled: false
      });

      // Customer view
      const res = await request(app)
        .get(`/api/returns/${returnDoc._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.damageCharge).toBeNull();
      expect(res.body.data.depositRefunded).toBeNull();
      expect(res.body.data.settled).toBe(false);

      // Admin view must see actual draft values
      const adminRes = await request(app)
        .get(`/api/returns/${returnDoc._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.damageCharge).toBe(500);
      expect(adminRes.body.data.depositRefunded).toBe(2500);
    });
  });

  describe('POST /api/returns/:id/settle (ADMIN only)', () => {
    it('should settle return, calculate deposit refund, and transition booking to COMPLETED atomically', async () => {
      const booking = await MockBooking.create({
        customerId: customerUser._id,
        clothingId: new mongoose.Types.ObjectId(),
        rentalStartDate: new Date('2026-10-20'),
        returnDate: new Date('2026-10-22'),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 2000,
        securityDeposit: 3000,
        totalAmount: 5000,
        status: 'RETURNED'
      });

      const returnDoc = await Return.create({
        bookingId: booking._id,
        clothingId: booking.clothingId,
        customerId: customerUser._id,
        expectedReturnDate: new Date('2026-10-22'),
        actualReturnDate: new Date('2026-10-24'),
        lateDays: 2,
        fine: 200,
        condition: 'GOOD',
        status: 'LATE',
        damageCharge: 0,
        depositRefunded: 0,
        finePaid: false,
        settled: false
      });

      const res = await request(app)
        .post(`/api/returns/${returnDoc._id}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ damageCharge: 500 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.depositRefunded).toBe(2500); // 3000 - 500
      expect(res.body.data.finePaid).toBe(true);
      expect(res.body.data.settled).toBe(true);
      expect(res.body.data.settledAt).not.toBeNull();

      // Verify atomic booking status transition to COMPLETED
      const updatedBooking = await MockBooking.findById(booking._id);
      expect(updatedBooking.status).toBe('COMPLETED');
    });

    it('should return 409 SETTLEMENT_ALREADY_COMPLETED on repeat settlement attempt', async () => {
      const booking = await MockBooking.create({
        customerId: customerUser._id,
        clothingId: new mongoose.Types.ObjectId(),
        rentalStartDate: new Date('2026-10-20'),
        returnDate: new Date('2026-10-22'),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 2000,
        securityDeposit: 3000,
        totalAmount: 5000,
        status: 'RETURNED'
      });

      const returnDoc = await Return.create({
        bookingId: booking._id,
        clothingId: booking.clothingId,
        customerId: customerUser._id,
        expectedReturnDate: new Date('2026-10-22'),
        actualReturnDate: new Date('2026-10-24'),
        lateDays: 2,
        fine: 200,
        condition: 'GOOD',
        status: 'LATE',
        damageCharge: 0,
        depositRefunded: 3000,
        finePaid: true,
        settled: true,
        settledAt: new Date()
      });

      const res = await request(app)
        .post(`/api/returns/${returnDoc._id}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ damageCharge: 0 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe(ERROR_CODES.SETTLEMENT_ALREADY_COMPLETED);
    });

    it('should reject damage charge exceeding security deposit with 400 VALIDATION_ERROR', async () => {
      const booking = await MockBooking.create({
        customerId: customerUser._id,
        clothingId: new mongoose.Types.ObjectId(),
        rentalStartDate: new Date('2026-10-20'),
        returnDate: new Date('2026-10-22'),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 2000,
        securityDeposit: 1000,
        totalAmount: 3000,
        status: 'RETURNED'
      });

      const returnDoc = await Return.create({
        bookingId: booking._id,
        clothingId: booking.clothingId,
        customerId: customerUser._id,
        expectedReturnDate: new Date('2026-10-22'),
        actualReturnDate: new Date('2026-10-22'),
        lateDays: 0,
        fine: 0,
        condition: 'GOOD',
        status: 'RETURNED',
        damageCharge: 0,
        depositRefunded: 0,
        finePaid: false,
        settled: false
      });

      const res = await request(app)
        .post(`/api/returns/${returnDoc._id}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ damageCharge: 1500 }); // Exceeds 1000

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });
});
