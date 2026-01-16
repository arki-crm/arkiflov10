// MongoDB Initialization Script
// Creates application user with readWrite access to arkiflo database only
// This runs automatically on first MongoDB container startup

// Switch to the application database
db = db.getSiblingDB('arkiflo');

// Create application user with restricted access
db.createUser({
  user: process.env.MONGO_APP_USER || 'arkiflo_app',
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [
    {
      role: 'readWrite',
      db: 'arkiflo'
    }
  ]
});

print('✓ MongoDB application user created successfully');
print('✓ User has readWrite access to arkiflo database only');
