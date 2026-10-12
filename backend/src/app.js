const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const errorHandler = require('./middleware/error.middleware');

// Routes
const categoryRoutes = require('./routes/category.routes');
const clothingRoutes = require('./routes/clothing.routes');
const paymentRoutes = require('./routes/payment.routes');
const returnRoutes = require('./routes/return.routes');
const { protect } = require('./middleware/auth.middleware');

const app = express();

app.use(express.json());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(helmet());
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Perfect Rent & Remind API is running.' });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/categories', categoryRoutes);
app.use('/api/clothing', clothingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/returns', returnRoutes);

// Nested booking payment route: GET /api/bookings/:bookingId/payment
app.get('/api/bookings/:bookingId/payment', protect, paymentRoutes.getPaymentByBookingId);

// Error Middleware
app.use(errorHandler);

module.exports = app;
