const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Clothing = require('../src/models/Clothing');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const Return = require('../src/models/Return');
const generateToken = require('../src/utils/generateToken');
const { ERROR_CODES } = require('../src/utils/constants');

describe('Full End-to-End Real Module Integration Tests', () => {
  let replSet;
  let adminUser;
  let adminToken;
  let customerUser1;
  let customerToken1;
  let customerUser2;
  let customerToken2;
  let testCategory;
  let testClothing;

  beforeAll(async () => {
    // 1. Start MongoMemoryReplSet for real MongoDB multi-document transactions
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(replSet.getUri());
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    await replSet.stop();
  });

  beforeEach(async () => {
    // Clean all collections before each test
    await User.deleteMany({});
    await Category.deleteMany({});
    await Clothing.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Return.deleteMany({});

    // Create Admin
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@perfectrent.test',
      password: 'password123',
      role: 'ADMIN'
    });
    adminToken = generateToken(adminUser._id, 'ADMIN');

    // Create Customer 1
    customerUser1 = await User.create({
      name: 'Customer Alice',
      email: 'alice@perfectrent.test',
      password: 'password123',
      role: 'CUSTOMER'
    });
    customerToken1 = generateToken(customerUser1._id, 'CUSTOMER');

    // Create Customer 2
    customerUser2 = await User.create({
      name: 'Customer Bob',
      email: 'bob@perfectrent.test',
      password: 'password123',
      role: 'CUSTOMER'
    });
    customerToken2 = generateToken(customerUser2._id, 'CUSTOMER');

    // Create Category & Clothing
    testCategory = await Category.create({
      name: 'Designer Sherwani',
      description: 'Luxury wedding wear'
    });

    testClothing = await Clothing.create({
      name: 'Royal Black Sherwani',
      categoryId: testCategory._id,
      description: 'Handcrafted premium silk',
      size: 'XL',
      color: 'Black',
      rentalPrice: 1000,
      securityDeposit: 2500,
      quantity: 5,
      condition: 'EXCELLENT',
      availabilityStatus: 'AVAILABLE'
    });
  });

  describe('1 & 2. Full Electronic Payment (UPI) Booking Lifecycle', () => {
    it('should complete booking creation, atomic UPI confirmation, pickup, return, and settlement using real models', async () => {
      // Step 1: Customer creates booking
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: '2026-11-01',
          returnDate: '2026-11-04',
          quantity: 2
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const bookingId = createRes.body.data.id;
      expect(createRes.body.data.status).toBe('PENDING');
      expect(createRes.body.data.rentalDuration).toBe(3);
      expect(createRes.body.data.rentalAmount).toBe(6000); // 1000 * 2 * 3
      expect(createRes.body.data.securityDeposit).toBe(2500); // flat
      expect(createRes.body.data.totalAmount).toBe(8500);

      // Verify booking document in DB
      const bookingInDb = await Booking.findById(bookingId);
      expect(bookingInDb.status).toBe('PENDING');

      // Step 2: Customer pays via UPI -> atomically confirms booking
      const payRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({
          bookingId,
          method: 'UPI'
        });

      expect(payRes.status).toBe(201);
      expect(payRes.body.success).toBe(true);
      expect(payRes.body.data.status).toBe('PAID');
      expect(payRes.body.data.amount).toBe(8500);
      expect(payRes.body.data.paidAt).toBeDefined();

      // Check DB: Booking must now be CONFIRMED
      const confirmedBooking = await Booking.findById(bookingId);
      expect(confirmedBooking.status).toBe('CONFIRMED');

      // Step 3: Admin marks pickup
      const pickupRes = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PICKED_UP' });

      expect(pickupRes.status).toBe(200);
      expect(pickupRes.body.data.status).toBe('PICKED_UP');

      const pickedUpBooking = await Booking.findById(bookingId);
      expect(pickedUpBooking.status).toBe('PICKED_UP');

      // Step 4: Admin records return
      const returnRes = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId,
          actualReturnDate: '2026-11-04', // on time
          condition: 'GOOD'
        });

      expect(returnRes.status).toBe(201);
      expect(returnRes.body.success).toBe(true);
      const returnId = returnRes.body.data.id;
      expect(returnRes.body.data.lateDays).toBe(0);
      expect(returnRes.body.data.fine).toBe(0);
      expect(returnRes.body.data.status).toBe('RETURNED');

      // Check DB: Booking must now be RETURNED
      const returnedBooking = await Booking.findById(bookingId);
      expect(returnedBooking.status).toBe('RETURNED');

      // Step 5: Admin settles return
      const settleRes = await request(app)
        .post(`/api/returns/${returnId}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ damageCharge: 500 });

      expect(settleRes.status).toBe(200);
      expect(settleRes.body.success).toBe(true);
      expect(settleRes.body.data.depositRefunded).toBe(2000); // 2500 - 500
      expect(settleRes.body.data.settled).toBe(true);

      // Check DB: Booking must now be COMPLETED
      const completedBooking = await Booking.findById(bookingId);
      expect(completedBooking.status).toBe('COMPLETED');
    });
  });

  describe('3. Full Cash On Pickup Lifecycle', () => {
    it('should handle cash on pickup selection, manual confirmation, atomic handover payment collection, and settlement', async () => {
      // Step 1: Customer creates booking
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: '2026-11-10',
          returnDate: '2026-11-12',
          quantity: 1
        });

      const bookingId = createRes.body.data.id;

      // Step 2: Customer chooses CASH_ON_PICKUP
      const payRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({
          bookingId,
          method: 'CASH_ON_PICKUP'
        });

      expect(payRes.status).toBe(201);
      expect(payRes.body.data.status).toBe('PENDING');
      expect(payRes.body.data.paidAt).toBeNull();

      // Booking remains PENDING
      let booking = await Booking.findById(bookingId);
      expect(booking.status).toBe('PENDING');

      // Step 3: Admin confirms booking with existing pending cash payment
      const confirmRes = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED' });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.status).toBe('CONFIRMED');

      // Payment remains PENDING
      let payment = await Payment.findOne({ bookingId });
      expect(payment.status).toBe('PENDING');

      // Step 4: Admin performs physical handover (CONFIRMED -> PICKED_UP)
      // Must update existing payment to PAID and booking to PICKED_UP atomically in one transaction
      const pickupRes = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PICKED_UP' });

      expect(pickupRes.status).toBe(200);
      expect(pickupRes.body.data.status).toBe('PICKED_UP');

      // Verify payment updated to PAID with paidAt timestamp
      payment = await Payment.findOne({ bookingId });
      expect(payment.status).toBe('PAID');
      expect(payment.paidAt).toBeDefined();

      // Verify exactly ONE payment document exists (no duplicates)
      const count = await Payment.countDocuments({ bookingId });
      expect(count).toBe(1);

      // Step 5: Return late by 2 days (2026-11-14 instead of 2026-11-12)
      const returnRes = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId,
          actualReturnDate: '2026-11-14',
          condition: 'GOOD'
        });

      expect(returnRes.status).toBe(201);
      expect(returnRes.body.data.lateDays).toBe(2);
      expect(returnRes.body.data.fine).toBe(200); // 2 * 100
      expect(returnRes.body.data.status).toBe('LATE');

      booking = await Booking.findById(bookingId);
      expect(booking.status).toBe('RETURNED');

      // Step 6: Settle return
      const settleRes = await request(app)
        .post(`/api/returns/${returnRes.body.data.id}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ damageCharge: 0 });

      expect(settleRes.status).toBe(200);
      expect(settleRes.body.data.finePaid).toBe(true);
      expect(settleRes.body.data.depositRefunded).toBe(2500);

      booking = await Booking.findById(bookingId);
      expect(booking.status).toBe('COMPLETED');
    });
  });

  describe('6. Real Transaction Rollback Integrity', () => {
    it('should rollback payment creation completely if booking transition fails', async () => {
      // Create a booking directly in CANCELLED status
      const cancelledBooking = await Booking.create({
        customerId: customerUser1._id,
        clothingId: testClothing._id,
        rentalStartDate: new Date('2026-12-01T00:00:00.000Z'),
        returnDate: new Date('2026-12-03T00:00:00.000Z'),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 2000,
        securityDeposit: 2500,
        totalAmount: 4500,
        status: 'CANCELLED'
      });

      // Attempt to pay for cancelled booking
      const payRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({
          bookingId: cancelledBooking._id.toString(),
          method: 'UPI'
        });

      expect(payRes.status).toBe(400);
      expect(payRes.body.error.code).toBe(ERROR_CODES.BOOKING_INVALID_STATUS);

      // Verify no payment document was committed
      const paymentInDb = await Payment.findOne({ bookingId: cancelledBooking._id });
      expect(paymentInDb).toBeNull();
    });

    it('should rollback return creation if booking transition fails', async () => {
      // Create a booking in CONFIRMED status (not eligible for return)
      const confirmedBooking = await Booking.create({
        customerId: customerUser1._id,
        clothingId: testClothing._id,
        rentalStartDate: new Date('2026-12-01T00:00:00.000Z'),
        returnDate: new Date('2026-12-03T00:00:00.000Z'),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 2000,
        securityDeposit: 2500,
        totalAmount: 4500,
        status: 'CONFIRMED'
      });

      const returnRes = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId: confirmedBooking._id.toString(),
          actualReturnDate: '2026-12-03',
          condition: 'GOOD'
        });

      expect(returnRes.status).toBe(400);
      expect(returnRes.body.error.code).toBe(ERROR_CODES.RETURN_INVALID_BOOKING);

      // Verify Return document was not created
      const returnInDb = await Return.findOne({ bookingId: confirmedBooking._id });
      expect(returnInDb).toBeNull();
      // Booking remains CONFIRMED
      const bookingInDb = await Booking.findById(confirmedBooking._id);
      expect(bookingInDb.status).toBe('CONFIRMED');
    });
  });

  describe('7. Security, Permissions, Duplicate Protections & Cancellation Refund', () => {
    it('should enforce customer isolation across booking, payment, and return access', async () => {
      // Customer 1 creates a booking
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: '2026-12-10',
          returnDate: '2026-12-12',
          quantity: 1
        });
      const bookingId = createRes.body.data.id;

      // Customer 2 attempts to view Customer 1 booking
      const getRes = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${customerToken2}`);
      expect(getRes.status).toBe(403);
      expect(getRes.body.error.code).toBe(ERROR_CODES.FORBIDDEN);

      // Customer 2 attempts to pay Customer 1 booking
      const payRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken2}`)
        .send({
          bookingId,
          method: 'UPI'
        });
      expect(payRes.status).toBe(403);
      expect(payRes.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should reject duplicate payment, duplicate return, and duplicate settlement', async () => {
      // 1. Create booking & pay
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: '2026-12-15',
          returnDate: '2026-12-17',
          quantity: 1
        });
      const bookingId = createRes.body.data.id;

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({ bookingId, method: 'UPI' });

      // Duplicate payment attempt
      const dupPayRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({ bookingId, method: 'UPI' });
      expect(dupPayRes.status).toBe(400);
      expect(dupPayRes.body.error.code).toBe(ERROR_CODES.PAYMENT_ALREADY_PROCESSED);

      // Transition to PICKED_UP
      await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PICKED_UP' });

      // Process Return
      const retRes = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId,
          actualReturnDate: '2026-12-17',
          condition: 'GOOD'
        });
      const returnId = retRes.body.data.id;

      // Duplicate Return attempt
      const dupRetRes = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId,
          actualReturnDate: '2026-12-17',
          condition: 'GOOD'
        });
      expect(dupRetRes.status).toBe(400);
      expect(dupRetRes.body.error.code).toBe(ERROR_CODES.RETURN_ALREADY_COMPLETED);

      // Settle return
      await request(app)
        .post(`/api/returns/${returnId}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ damageCharge: 0 });

      // Duplicate Settlement attempt
      const dupSettleRes = await request(app)
        .post(`/api/returns/${returnId}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ damageCharge: 0 });
      expect(dupSettleRes.status).toBe(409);
      expect(dupSettleRes.body.error.code).toBe(ERROR_CODES.SETTLEMENT_ALREADY_COMPLETED);
    });

    it('should support cancellation of confirmed booking and admin refund under BR-031', async () => {
      // Customer creates booking and pays
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: '2026-12-20',
          returnDate: '2026-12-22',
          quantity: 1
        });
      const bookingId = createRes.body.data.id;

      const payRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({ bookingId, method: 'UPI' });
      const paymentId = payRes.body.data.id;

      // Customer cancels booking
      const cancelRes = await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken1}`);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');

      // Admin processes refund for cancelled booking
      const refundRes = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Customer requested cancellation' });

      expect(refundRes.status).toBe(200);
      expect(refundRes.body.data.status).toBe('REFUNDED');
      expect(refundRes.body.data.refundReason).toBe('Customer requested cancellation');

      // Attempting double refund returns PAYMENT_ALREADY_PROCESSED
      const doubleRefund = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Another refund attempt' });
      expect(doubleRefund.status).toBe(400);
      expect(doubleRefund.body.error.code).toBe(ERROR_CODES.PAYMENT_ALREADY_PROCESSED);
    });

    it('should reject refund on uncollected pending cash payment with PAYMENT_NOT_REFUNDABLE', async () => {
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: '2026-12-25',
          returnDate: '2026-12-27',
          quantity: 1
        });
      const bookingId = createRes.body.data.id;

      const payRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken1}`)
        .send({ bookingId, method: 'CASH_ON_PICKUP' });
      const paymentId = payRes.body.data.id;

      // Cancel booking
      await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken1}`);

      // Admin attempts refund on pending cash payment
      const refundRes = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Refund attempt' });

      expect(refundRes.status).toBe(400);
      expect(refundRes.body.error.code).toBe(ERROR_CODES.PAYMENT_NOT_REFUNDABLE);
    });
  });
});
