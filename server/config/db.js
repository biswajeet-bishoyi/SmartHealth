const mongoose = require('mongoose');
const { seedData } = require('../scripts/seed');

let mongod = null;

const connectDB = async () => {
  const customUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const isDefaultLocal = !customUri || customUri === 'mongodb://localhost:27017/smarthealthne';

  // 1. If user provided a custom URI (e.g. MongoDB Atlas), connect to it directly
  if (customUri && !isDefaultLocal) {
    try {
      const conn = await mongoose.connect(customUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`✅ MongoDB Cloud connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`❌ MongoDB Cloud connection error: ${error.message}`);
      console.log('⚠️ Falling back to in-memory demo database...');
    }
  } else {
    // 2. Try connecting to local mongodb://localhost:27017/smarthealthne with a fast 2-second timeout
    try {
      const conn = await mongoose.connect(customUri || 'mongodb://localhost:27017/smarthealthne', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`✅ Local MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.log('💡 Local MongoDB service not detected on localhost:27017');
      console.log('🚀 Starting Zero-Config In-Memory MongoDB for Hackathon Demo...');
    }
  }

  // 3. Fallback: Start in-memory MongoDB server & auto-seed
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`✅ In-Memory MongoDB started at: ${uri}`);
    console.log('🌱 Auto-populating SIH demo accounts and Northeast outbreak dataset...');
    await seedData();
    console.log('🎉 In-Memory Database ready for evaluation!\n');
  } catch (memError) {
    console.error(`❌ Failed to start in-memory database: ${memError.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
