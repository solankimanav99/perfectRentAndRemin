const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Payment = require('../src/models/Payment');
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
  // Use MongoMemoryReplSet to support multi-document replica-set transactions
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());

  // Define MockBooking schema matching CONTRACTS.md
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
        default: 'PENDING'
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
  await Payment.deleteMany({});
  await MockBooking.deleteMany({});

  customerUser = await User.create({
    name: 'Customer One',
    email: 'customer1@test.com',
    password: 'password123',
    role: 'CUSTOMER'
  });
  customerToken = generateToken(customerUser._id, customerUser.role);

  otherCustomerUser = await User.create({
    name: 'Customer Two',
    email: 'customer2@test.com',
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

describe('Payment API Integration Tests', () => {
  describe('POST /api/payments', () => {
    it('should successfully process electronic payment (UPI) and confirm booking atomically', async () => {
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
        status: 'PENDING'
      });

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          method: 'UPI'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PAID');
      expect(res.body.data.amount).toBe(3000);
      expect(res.body.data.transactionReference).toMatch(/^SIM-/);

      // Verify atomic booking confirmation
      const updatedBooking = await MockBooking.findById(booking._id);
      expect(updatedBooking.status).toBe('CONFIRMED');

      // Verify payment document in DB
      const paymentInDb = await Payment.findOne({ bookingId: booking._id });
      expect(paymentInDb).not.toBeNull();
      expect(paymentInDb.status).toBe('PAID');
      expect(paymentInDb.paidAt).not.toBeNull();
    });

    it('should create a PENDING payment for CASH_ON_PICKUP without confirming booking', async () => {
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
        status: 'PENDING'
      });

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          method: 'CASH_ON_PICKUP'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Cash on pickup selected successfully.');
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.paidAt).toBeNull();

      // Booking must remain PENDING
      const bookingInDb = await MockBooking.findById(booking._id);
      expect(bookingInDb.status).toBe('PENDING');
    });

    it('should reject payment if booking belongs to another customer with 403 FORBIDDEN', async () => {
      const booking = await MockBooking.create({
        customerId: otherCustomerUser._id,
        clothingId: new mongoose.Types.ObjectId(),
        rentalStartDate: new Date('2026-10-20'),
        returnDate: new Date('2026-10-22'),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 2000,
        securityDeposit: 1000,
        totalAmount: 3000,
        status: 'PENDING'
      });

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          method: 'UPI'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should reject duplicate payment attempt with 400 PAYMENT_ALREADY_PROCESSED', async () => {
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
        status: 'PENDING'
      });

      // First payment
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          method: 'UPI'
        });

      // Second payment attempt
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          method: 'UPI'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.PAYMENT_ALREADY_PROCESSED);
    });

    it('should reject payment on CANCELLED or RETURNED booking with 400 BOOKING_INVALID_STATUS', async () => {
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
        status: 'CANCELLED'
      });

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          method: 'UPI'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.BOOKING_INVALID_STATUS);
    });

    it('should record simulated failure and leave booking PENDING', async () => {
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
        status: 'PENDING'
      });

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('X-Simulate-Payment', 'FAILED')
        .send({
          bookingId: booking._id.toString(),
          method: 'UPI'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('FAILED');

      const bookingInDb = await MockBooking.findById(booking._id);
      expect(bookingInDb.status).toBe('PENDING');
    });

    it('should rollback transaction and not save payment if booking confirmation fails', async () => {
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
        status: 'PENDING'
      });

      // Simulate a failure during booking.save by mocking a schema error or spy
      const saveSpy = jest.spyOn(MockBooking.prototype, 'save').mockImplementationOnce(function () {
        throw new Error('Simulated database error during booking update');
      });

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          method: 'UPI'
        });

      saveSpy.mockRestore();

      expect(res.status).toBe(500);

      // Verify transaction rollback: Payment was NOT persisted as PAID
      const paymentInDb = await Payment.findOne({ bookingId: booking._id });
      expect(paymentInDb).toBeNull();

      // Booking remains PENDING
      const bookingInDb = await MockBooking.findById(booking._id);
      expect(bookingInDb.status).toBe('PENDING');
    });
  });

  describe('GET /api/payments and GET /api/payments/:id', () => {
    it('should allow customer to get their payments', async () => {
      await Payment.create({
        bookingId: new mongoose.Types.ObjectId(),
        customerId: customerUser._id,
        amount: 3000,
        method: 'UPI',
        status: 'PAID'
      });

      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should allow customer to view single payment belonging to them', async () => {
      const payment = await Payment.create({
        bookingId: new mongoose.Types.ObjectId(),
        customerId: customerUser._id,
        amount: 3000,
        method: 'UPI',
        status: 'PAID'
      });

      const res = await request(app)
        .get(`/api/payments/${payment._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(payment._id.toString());
    });

    it('should forbid customer from viewing another customer payment', async () => {
      const payment = await Payment.create({
        bookingId: new mongoose.Types.ObjectId(),
        customerId: otherCustomerUser._id,
        amount: 3000,
        method: 'UPI',
        status: 'PAID'
      });

      const res = await request(app)
        .get(`/api/payments/${payment._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  describe('POST /api/payments/:id/refund', () => {
    it('should allow admin to refund a PAID payment on a CANCELLED booking', async () => {
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
        status: 'CANCELLED'
      });

      const payment = await Payment.create({
        bookingId: booking._id,
        customerId: customerUser._id,
        amount: 3000,
        method: 'UPI',
        status: 'PAID',
        paidAt: new Date()
      });

      const res = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Customer requested cancellation' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REFUNDED');
      expect(res.body.data.refundReason).toBe('Customer requested cancellation');
      expect(res.body.data.refundedAt).not.toBeNull();
    });

    it('should reject refunding an uncollected/PENDING cash payment with PAYMENT_NOT_REFUNDABLE', async () => {
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
        status: 'CANCELLED'
      });

      const payment = await Payment.create({
        bookingId: booking._id,
        customerId: customerUser._id,
        amount: 3000,
        method: 'CASH_ON_PICKUP',
        status: 'PENDING',
        paidAt: null
      });

      const res = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.PAYMENT_NOT_REFUNDABLE);
    });

    it('should reject double refund with PAYMENT_ALREADY_PROCESSED', async () => {
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
        status: 'CANCELLED'
      });

      const payment = await Payment.create({
        bookingId: booking._id,
        customerId: customerUser._id,
        amount: 3000,
        method: 'UPI',
        status: 'REFUNDED',
        paidAt: new Date(),
        refundedAt: new Date()
      });

      const res = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.PAYMENT_ALREADY_PROCESSED);
    });
  });
});
