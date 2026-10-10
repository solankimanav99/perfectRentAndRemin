const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('User Model', () => {
  const validUserData = {
    name: 'Test Customer',
    email: 'test@example.com',
    password: 'password123',
    phone: '9876543210'
  };

  test('should create a user with default CUSTOMER role and hashed password', async () => {
    const user = new User(validUserData);
    const savedUser = await user.save();

    expect(savedUser.name).toBe(validUserData.name);
    expect(savedUser.email).toBe(validUserData.email);
    expect(savedUser.role).toBe('CUSTOMER'); // Default role check
    
    // Check if password was hashed
    expect(savedUser.password).not.toBe(validUserData.password);
    const isMatch = await bcrypt.compare(validUserData.password, savedUser.password);
    expect(isMatch).toBe(true);
  });

  test('should not return the password field in toJSON() output', async () => {
    const user = new User(validUserData);
    await user.save();

    const jsonUser = user.toJSON();
    
    expect(jsonUser.password).toBeUndefined();
    expect(jsonUser.id).toBeDefined(); // Should have mapped _id to id
    expect(jsonUser._id).toBeUndefined();
    expect(jsonUser.__v).toBeUndefined();
  });

  test('should prevent duplicate emails', async () => {
    const user1 = new User(validUserData);
    await user1.save();

    const user2 = new User({ ...validUserData, name: 'Another Name' });
    
    let error;
    try {
      await user2.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB duplicate key error code
  });

  test('should hash the password when modified', async () => {
    const user = new User(validUserData);
    await user.save();

    const initialHash = user.password;
    
    user.password = 'newpassword456';
    await user.save();

    expect(user.password).not.toBe('newpassword456');
    expect(user.password).not.toBe(initialHash);
    
    const isMatch = await bcrypt.compare('newpassword456', user.password);
    expect(isMatch).toBe(true);
  });

  test('should not re-hash the password if another field is modified', async () => {
    const user = new User(validUserData);
    await user.save();

    const initialHash = user.password;
    
    user.name = 'Updated Name';
    await user.save();

    // Password hash should remain exactly the same
    expect(user.password).toBe(initialHash);
  });
});
