// MongoDB initialization script
db = db.getSiblingDB('real-estate-email-processor');

// Create a user for the application
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'real-estate-email-processor'
    }
  ]
});

// Create collections with proper indexes
db.createCollection('properties');
db.createCollection('emaillogs');

// Create indexes for better performance
db.properties.createIndex({ "email_source": 1 });
db.properties.createIndex({ "status": 1 });
db.properties.createIndex({ "created_at": -1 });
db.properties.createIndex({ "address_hash": 1 }, { sparse: true });

db.emaillogs.createIndex({ "email_id": 1 }, { unique: true });
db.emaillogs.createIndex({ "processed_at": -1 });

print('MongoDB initialized successfully'); 