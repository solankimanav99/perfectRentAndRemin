const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Clothing = require('../src/models/Clothing');
const Booking = require('../src/models/Booking');
const generateToken = require('../src/utils/generateToken');
const { ERROR_CODES } = require('../src/utils/constants');

// Dynamic future UTC date generator (YYYY-MM-DD)
const getFutureDateStr = (daysAhead) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

let replSet;
let customerUser;
let customerToken;
let otherCustomerUser;
let otherCustomerToken;
let adminUser;
let adminToken;
let categoryId;
let testClothing;

beforeAll(async () => {
  // Use MongoMemoryReplSet to test multi-document transactions & concurrency
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Category.deleteMany({});
  await Clothing.deleteMany({});
  await Booking.deleteMany({});

  const cat = await Category.create({ name: 'Ethnic Wear', description: 'Traditional' });
  categoryId = cat._id.toString();

  testClothing = await Clothing.create({
    name: 'Royal Sherwani',
    categoryId,
    description: 'Designer wedding sherwani',
    size: 'L',
    color: 'Maroon',
    rentalPrice: 1500,
    securityDeposit: 3000,
    quantity: 3,
    condition: 'EXCELLENT',
    availabilityStatus: 'AVAILABLE'
  });

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

describe('Booking API & Concurrency Tests', () => {
  describe('POST /api/bookings', () => {
    it('should successfully create a PENDING booking with correct pricing and UTC dates', async () => {
      const startDate = getFutureDateStr(7);
      const returnDate = getFutureDateStr(9);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: startDate,
          returnDate: returnDate,
          quantity: 2
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Booking created successfully.');

      const data = res.body.data;
      expect(data.rentalDuration).toBe(2);
      expect(data.rentalAmount).toBe(6000); // 1500 * 2 duration * 2 quantity
      expect(data.securityDeposit).toBe(3000); // flat deposit
      expect(data.totalAmount).toBe(9000); // 6000 + 3000
      expect(data.status).toBe('PENDING');
      expect(data.rentalStartDate).toBe(`${startDate}T00:00:00.000Z`);
      expect(data.returnDate).toBe(`${returnDate}T00:00:00.000Z`);
    });

    it('should reject invalid dates where start >= returnDate with BOOKING_DATE_INVALID', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: getFutureDateStr(9),
          returnDate: getFutureDateStr(7),
          quantity: 1
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.BOOKING_DATE_INVALID);
    });

    it('should reject past start dates with BOOKING_DATE_INVALID', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: '2020-01-01',
          returnDate: '2020-01-05',
          quantity: 1
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.BOOKING_DATE_INVALID);
    });

    it('should reject quantity exceeding clothing total quantity with BOOKING_QUANTITY_INVALID', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: getFutureDateStr(5),
          returnDate: getFutureDateStr(7),
          quantity: 10 // Total is 3
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.BOOKING_QUANTITY_INVALID);
    });

    it('should return 409 BOOKING_OVERLAP when requested quantity exceeds available quantity for overlapping dates', async () => {
      const startDate1 = getFutureDateStr(5);
      const returnDate1 = getFutureDateStr(10);
      const startDate2 = getFutureDateStr(7);
      const returnDate2 = getFutureDateStr(9);

      // Create first booking reserving 2 units
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: startDate1,
          returnDate: returnDate1,
          quantity: 2
        });

      // Second booking tries to reserve 2 units for overlapping period (Total: 3, available: 1)
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: startDate2,
          returnDate: returnDate2,
          quantity: 2
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe(ERROR_CODES.BOOKING_OVERLAP);
    });

    it('should allow adjacent non-overlapping bookings (half-open interval)', async () => {
      const startDate1 = getFutureDateStr(5);
      const midDate = getFutureDateStr(7);
      const endDate2 = getFutureDateStr(10);

      // Booking 1: startDate1 to midDate (reserves all 3 units)
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: startDate1,
          returnDate: midDate,
          quantity: 3
        });

      // Booking 2: midDate to endDate2 (starts on return date of booking 1 -> no overlap)
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: midDate,
          returnDate: endDate2,
          quantity: 3
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should handle concurrent overlapping booking requests safely without overselling', async () => {
      // testClothing total quantity is 3. We launch two simultaneous requests each wanting 2 units.
      // Exactly one must succeed with 201, and one must be rejected with 409 BOOKING_OVERLAP.
      const startDate = getFutureDateStr(12);
      const returnDate = getFutureDateStr(16);

      const req1 = request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: startDate,
          returnDate: returnDate,
          quantity: 2
        });

      const req2 = request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: startDate,
          returnDate: returnDate,
          quantity: 2
        });

      const [res1, res2] = await Promise.all([req1, req2]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 409]);

      const bookings = await Booking.find({ clothingId: testClothing._id, status: 'PENDING' });
      expect(bookings.length).toBe(1);
      expect(bookings[0].quantity).toBe(2);
    });
  });

  describe('GET /api/bookings and GET /api/bookings/:id', () => {
    it('should return only the authenticated caller own bookings', async () => {
      const startDate = getFutureDateStr(5);
      const returnDate = getFutureDateStr(7);

      await Booking.create({
        customerId: customerUser._id,
        clothingId: testClothing._id,
        rentalStartDate: new Date(`${startDate}T00:00:00.000Z`),
        returnDate: new Date(`${returnDate}T00:00:00.000Z`),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 3000,
        securityDeposit: 3000,
        totalAmount: 6000,
        status: 'PENDING'
      });

      await Booking.create({
        customerId: otherCustomerUser._id,
        clothingId: testClothing._id,
        rentalStartDate: new Date(`${startDate}T00:00:00.000Z`),
        returnDate: new Date(`${returnDate}T00:00:00.000Z`),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 3000,
        securityDeposit: 3000,
        totalAmount: 6000,
        status: 'PENDING'
      });

      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].customerId.toString()).toBe(customerUser._id.toString());
    });

    it('should allow customer to get their single booking by ID', async () => {
      const startDate = getFutureDateStr(5);
      const returnDate = getFutureDateStr(7);

      const booking = await Booking.create({
        customerId: customerUser._id,
        clothingId: testClothing._id,
        rentalStartDate: new Date(`${startDate}T00:00:00.000Z`),
        returnDate: new Date(`${returnDate}T00:00:00.000Z`),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 3000,
        securityDeposit: 3000,
        totalAmount: 6000,
        status: 'PENDING'
      });

      const res = await request(app)
        .get(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(booking._id.toString());
    });

    it('should forbid customer from viewing another customer booking with 403 FORBIDDEN', async () => {
      const startDate = getFutureDateStr(5);
      const returnDate = getFutureDateStr(7);

      const booking = await Booking.create({
        customerId: otherCustomerUser._id,
        clothingId: testClothing._id,
        rentalStartDate: new Date(`${startDate}T00:00:00.000Z`),
        returnDate: new Date(`${returnDate}T00:00:00.000Z`),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 3000,
        securityDeposit: 3000,
        totalAmount: 6000,
        status: 'PENDING'
      });

      const res = await request(app)
        .get(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  describe('PUT /api/bookings/:id/cancel', () => {
    it('should cancel a PENDING booking and release reserved inventory', async () => {
      const startDate = getFutureDateStr(5);
      const returnDate = getFutureDateStr(7);

      const booking = await Booking.create({
        customerId: customerUser._id,
        clothingId: testClothing._id,
        rentalStartDate: new Date(`${startDate}T00:00:00.000Z`),
        returnDate: new Date(`${returnDate}T00:00:00.000Z`),
        quantity: 3, // Reserving all inventory
        rentalDuration: 2,
        rentalAmount: 9000,
        securityDeposit: 3000,
        totalAmount: 12000,
        status: 'PENDING'
      });

      const res = await request(app)
        .put(`/api/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');

      // Now another user can book the full quantity
      const rebookRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          clothingId: testClothing._id.toString(),
          rentalStartDate: startDate,
          returnDate: returnDate,
          quantity: 3
        });

      expect(rebookRes.status).toBe(201);
    });

    it('should reject cancelling a RETURNED booking with BOOKING_NOT_CANCELLABLE', async () => {
      const startDate = getFutureDateStr(5);
      const returnDate = getFutureDateStr(7);

      const booking = await Booking.create({
        customerId: customerUser._id,
        clothingId: testClothing._id,
        rentalStartDate: new Date(`${startDate}T00:00:00.000Z`),
        returnDate: new Date(`${returnDate}T00:00:00.000Z`),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 3000,
        securityDeposit: 3000,
        totalAmount: 6000,
        status: 'RETURNED'
      });

      const res = await request(app)
        .put(`/api/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.BOOKING_NOT_CANCELLABLE);
    });
  });

  describe('Shared Booking Service Session & Transaction Integrity', () => {
    it('confirmBooking should transition PENDING to CONFIRMED within caller session', async () => {
      const startDate = getFutureDateStr(5);
      const returnDate = getFutureDateStr(7);

      const booking = await Booking.create({
        customerId: customerUser._id,
        clothingId: testClothing._id,
        rentalStartDate: new Date(`${startDate}T00:00:00.000Z`),
        returnDate: new Date(`${returnDate}T00:00:00.000Z`),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 3000,
        securityDeposit: 3000,
        totalAmount: 6000,
        status: 'PENDING'
      });

      const bookingService = require('../src/services/booking.service');
      const session = await mongoose.startSession();
      session.startTransaction();

      await bookingService.confirmBooking(booking._id, { session });
      await session.commitTransaction();
      session.endSession();

      const updated = await Booking.findById(booking._id);
      expect(updated.status).toBe('CONFIRMED');
    });

    it('confirmBooking should rollback completely when session is aborted', async () => {
      const startDate = getFutureDateStr(5);
      const returnDate = getFutureDateStr(7);

      const booking = await Booking.create({
        customerId: customerUser._id,
        clothingId: testClothing._id,
        rentalStartDate: new Date(`${startDate}T00:00:00.000Z`),
        returnDate: new Date(`${returnDate}T00:00:00.000Z`),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 3000,
        securityDeposit: 3000,
        totalAmount: 6000,
        status: 'PENDING'
      });

      const bookingService = require('../src/services/booking.service');
      const session = await mongoose.startSession();
      session.startTransaction();

      await bookingService.confirmBooking(booking._id, { session });
      await session.abortTransaction();
      session.endSession();

      const updated = await Booking.findById(booking._id);
      expect(updated.status).toBe('PENDING'); // Rollback preserved
    });

    it('markBookingReturned should transition PICKED_UP to RETURNED and settleBooking to COMPLETED', async () => {
      const startDate = getFutureDateStr(5);
      const returnDate = getFutureDateStr(7);

      const booking = await Booking.create({
        customerId: customerUser._id,
        clothingId: testClothing._id,
        rentalStartDate: new Date(`${startDate}T00:00:00.000Z`),
        returnDate: new Date(`${returnDate}T00:00:00.000Z`),
        quantity: 1,
        rentalDuration: 2,
        rentalAmount: 3000,
        securityDeposit: 3000,
        totalAmount: 6000,
        status: 'PICKED_UP'
      });

      const bookingService = require('../src/services/booking.service');

      // Test markBookingReturned
      await bookingService.markBookingReturned(booking._id);
      let updated = await Booking.findById(booking._id);
      expect(updated.status).toBe('RETURNED');

      // Test settleBooking
      await bookingService.settleBooking(booking._id);
      updated = await Booking.findById(booking._id);
      expect(updated.status).toBe('COMPLETED');
    });
  });
});
