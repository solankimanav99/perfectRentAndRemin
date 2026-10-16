require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const env = require('../config/env');

const seedAdmin = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured in environment.');
      process.exit(1);
    }

    // Check if an admin with configured email exists
    let adminUser = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase().trim() });
    if (adminUser) {
      console.log(`Admin account (${adminUser.email}) exists. Ensuring role and display name...`);
      adminUser.name = env.ADMIN_NAME || 'Shubham';
      adminUser.role = 'ADMIN';
      if (env.ADMIN_PASSWORD) {
        adminUser.password = env.ADMIN_PASSWORD;
      }
      await adminUser.save();
      console.log('Admin account verified and updated successfully.');
      console.log(`Display Name: ${adminUser.name}`);
      console.log(`Role: ${adminUser.role}`);
      process.exit(0);
    }

    // Create the admin user
    adminUser = new User({
      name: env.ADMIN_NAME || 'Shubham',
      email: env.ADMIN_EMAIL.toLowerCase().trim(),
      password: env.ADMIN_PASSWORD,
      role: 'ADMIN'
    });

    await adminUser.save();

    console.log('Admin account created successfully!');
    console.log(`Display Name: ${adminUser.name}`);
    console.log(`Email: ${adminUser.email}`);
    console.log('Role: ADMIN');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin account:', error.message);
    process.exit(1);
  }
};

seedAdmin();
