import mongoose from 'mongoose';

const connectDatabase = async () => {
  try {
    // Allow running in a degraded mode (no DB) when MONGODB_URI is not provided
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI is not set. Running without database. Some features will be disabled.');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // Do not exit the process; continue to serve endpoints that don't require DB
    console.warn('Continuing without database connection.');
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`🚨 Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed due to app termination');
  process.exit(0);
});

export default connectDatabase;
