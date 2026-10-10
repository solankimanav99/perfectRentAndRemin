require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const env = require('../config/env');

const seedAdmin = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Check if an admin already exists
    const adminExists = await User.findOne({ email: env.ADMIN_EMAIL });
    if (adminExists) {
      console.log(`Admin account with email ${env.ADMIN_EMAIL} already exists.`);
      process.exit(0);
    }

    // Create the admin user
    const adminUser = new User({
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      role: 'ADMIN' // Explicitly set role
    });

    await adminUser.save();

    console.log('Admin account created successfully!');
    console.log(`Email: ${env.ADMIN_EMAIL}`);
    console.log('Role: ADMIN');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin account:', error);
    process.exit(1);
  }
};

seedAdmin();
