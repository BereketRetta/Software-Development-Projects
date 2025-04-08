// src/config/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

/**
 * Connect to MongoDB database
 */

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Add these options if using an older version of Mongoose
      // For Mongoose 6+, these are the defaults
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Connected...');
  } catch (err: any) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};


/**
 * Close MongoDB connection
 */
export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err: any) {
    console.error('Error closing MongoDB connection:', err.message);
  }
};