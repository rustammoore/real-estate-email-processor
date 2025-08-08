#!/usr/bin/env node

/**
 * Migration Script: Add User Authentication to Existing Properties
 * 
 * This script helps migrate existing properties to the new authentication system
 * by creating a default admin user and associating existing properties with that user.
 * 
 * Usage:
 *   node scripts/migrate-to-auth.js
 * 
 * Prerequisites:
 *   - MongoDB running
 *   - Backend dependencies installed
 *   - MONGODB_URI configured in .env
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

// Import models
const User = require('../backend/models/User');
const Property = require('../backend/models/Property');
const EmailLog = require('../backend/models/EmailLog');

const ADMIN_USER = {
  name: 'Admin User',
  email: 'admin@realestate.local',
  password: 'Admin123!',
  role: 'admin'
};

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function createDefaultUser() {
  try {
    // Check if admin user already exists
    const existingUser = await User.findOne({ email: ADMIN_USER.email });
    
    if (existingUser) {
      console.log('✅ Admin user already exists:', existingUser.email);
      return existingUser;
    }

    // Create new admin user
    const adminUser = new User(ADMIN_USER);
    await adminUser.save();
    
    console.log('✅ Created admin user:', adminUser.email);
    console.log('   📧 Email:', ADMIN_USER.email);
    console.log('   🔑 Password:', ADMIN_USER.password);
    console.log('   ⚠️  Please change the password after first login!');
    
    return adminUser;
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
}

async function migrateProperties(adminUser) {
  try {
    // Find properties without user association
    const propertiesWithoutUser = await Property.find({ user: { $exists: false } });
    
    if (propertiesWithoutUser.length === 0) {
      console.log('✅ All properties already have user associations');
      return;
    }

    console.log(`📦 Found ${propertiesWithoutUser.length} properties without user association`);
    
    // Associate properties with admin user
    const result = await Property.updateMany(
      { user: { $exists: false } },
      { $set: { user: adminUser._id } }
    );

    console.log(`✅ Updated ${result.modifiedCount} properties with admin user`);
  } catch (error) {
    console.error('❌ Failed to migrate properties:', error);
    throw error;
  }
}

async function migrateEmailLogs(adminUser) {
  try {
    // Find email logs without user association
    const emailLogsWithoutUser = await EmailLog.find({ user: { $exists: false } });
    
    if (emailLogsWithoutUser.length === 0) {
      console.log('✅ All email logs already have user associations');
      return;
    }

    console.log(`📧 Found ${emailLogsWithoutUser.length} email logs without user association`);
    
    // Associate email logs with admin user
    const result = await EmailLog.updateMany(
      { user: { $exists: false } },
      { $set: { user: adminUser._id } }
    );

    console.log(`✅ Updated ${result.modifiedCount} email logs with admin user`);
  } catch (error) {
    console.error('❌ Failed to migrate email logs:', error);
    throw error;
  }
}

async function displayStatistics() {
  try {
    const userCount = await User.countDocuments();
    const propertyCount = await Property.countDocuments();
    const emailLogCount = await EmailLog.countDocuments();
    
    console.log('\n📊 Migration Statistics:');
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   🏠 Properties: ${propertyCount}`);
    console.log(`   📧 Email Logs: ${emailLogCount}`);
    
    // Show properties per user
    const propertyStats = await Property.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userName: '$user.name',
          userEmail: '$user.email',
          propertyCount: '$count'
        }
      }
    ]);

    console.log('\n📈 Properties per user:');
    propertyStats.forEach(stat => {
      console.log(`   ${stat.userName} (${stat.userEmail}): ${stat.propertyCount} properties`);
    });

  } catch (error) {
    console.error('❌ Failed to display statistics:', error);
  }
}

async function main() {
  console.log('🚀 Starting migration to authentication system...\n');
  
  try {
    // Connect to database
    await connectToDatabase();
    
    // Create default admin user
    const adminUser = await createDefaultUser();
    
    // Migrate existing data
    await migrateProperties(adminUser);
    await migrateEmailLogs(adminUser);
    
    // Display final statistics
    await displayStatistics();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Start the frontend server: npm start');
    console.log('   3. Navigate to http://localhost:3100');
    console.log('   4. Login with admin credentials shown above');
    console.log('   5. Change the admin password in Profile settings');
    console.log('   6. Create additional user accounts as needed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n⚠️  Migration interrupted by user');
  await mongoose.disconnect();
  process.exit(0);
});

// Run migration if script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };