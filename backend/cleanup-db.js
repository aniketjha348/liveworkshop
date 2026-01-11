/**
 * Database Cleanup Script
 * Clears all test data EXCEPT admin users
 * 
 * Usage: node cleanup-db.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error('❌ MONGO_URL not found in environment');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function cleanDatabase() {
  try {
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('\n📋 Found collections:', collectionNames.join(', '));
    console.log('\n⚠️  Admin users will be PRESERVED!');
    
    // Confirm deletion
    rl.question('\n⚠️  Delete all data except admin users? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        console.log('\n🗑️  Deleting data (preserving admins)...\n');
        
        for (const name of collectionNames) {
          if (name === 'users') {
            // Only delete non-admin users
            const result = await db.collection(name).deleteMany({ role: { $ne: 'admin' } });
            console.log(`  ✓ ${name}: ${result.deletedCount} non-admin users deleted`);
          } else {
            // Delete all documents in other collections
            const result = await db.collection(name).deleteMany({});
            console.log(`  ✓ ${name}: ${result.deletedCount} documents deleted`);
          }
        }
        
        // Show remaining admins
        const admins = await db.collection('users').find({ role: 'admin' }).toArray();
        console.log(`\n👤 Admin users preserved: ${admins.length}`);
        admins.forEach(a => console.log(`   - ${a.email}`));
        
        console.log('\n✅ Cleanup complete!');
      } else {
        console.log('\n❌ Operation cancelled.');
      }
      
      await mongoose.disconnect();
      rl.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
