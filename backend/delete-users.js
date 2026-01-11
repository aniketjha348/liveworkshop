require('dotenv').config();
const mongoose = require('mongoose');

async function deleteNonAdminUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Find non-admin users
    const users = await db.collection('users').find({ role: { $ne: 'admin' } }).toArray();
    console.log('Non-admin users found:', users.length);
    users.forEach(u => console.log('  -', u.email, '(', u.name, ')'));
    
    if (users.length > 0) {
      // Delete them
      const result = await db.collection('users').deleteMany({ role: { $ne: 'admin' } });
      console.log('Deleted:', result.deletedCount, 'users');
    } else {
      console.log('No non-admin users to delete');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteNonAdminUsers();
