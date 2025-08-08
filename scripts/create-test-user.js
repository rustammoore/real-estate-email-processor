const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require('../backend/node_modules/mongoose');
const bcrypt = require('../backend/node_modules/bcryptjs');
const User = require('../backend/models/User');

async function createTestUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:3102/real-estate-email-processor?authSource=admin';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists!');
      console.log('Email: test@example.com');
      console.log('Password: Test123!');
      process.exit(0);
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'agent',
      isActive: true
    });

    await testUser.save();
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: Test123!');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser();