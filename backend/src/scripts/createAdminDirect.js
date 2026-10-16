require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const env = require('../config/env');

async function createAdmin() {
  await mongoose.connect(env.MONGO_URI);
  
  await User.deleteOne({ email: 'admin@example.com' });

  const admin = new User({
    name: 'Super Admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'ADMIN',
    phone: '9876543210'
  });

  await admin.save();
  console.log('SUCCESS: Admin created -> email: admin@example.com, password: password123, role: ADMIN');
  await mongoose.disconnect();
}

createAdmin().catch(console.error);
