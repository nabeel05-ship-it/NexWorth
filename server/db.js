import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, lastFailure: 0 };
}

const FAILURE_COOLDOWN_MS = 5000; // Wait 5s before re-attempting if cluster unreachable

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Avoid stalling requests if cluster was recently unreachable
  const now = Date.now();
  if (cached.lastFailure && now - cached.lastFailure < FAILURE_COOLDOWN_MS) {
    return null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      })
      .then((m) => {
        cached.lastFailure = 0;
        console.log(`✅ MongoDB Connected to database: ${m.connection.name}`);
        return m.connection;
      })
      .catch((err) => {
        cached.lastFailure = Date.now();
        cached.promise = null;
        console.warn(`⚠️ MongoDB connection attempt failed (using in-memory fallback): ${err.message}`);
        return null;
      });
  }

  try {
    const conn = await cached.promise;
    return conn;
  } catch (err) {
    cached.promise = null;
    cached.lastFailure = Date.now();
    return null;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export default connectDB;
