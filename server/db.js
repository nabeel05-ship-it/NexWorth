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

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        // Atlas can take longer than five seconds to wake or complete TLS on a
        // fresh serverless instance. A failed first request must not send the
        // rest of that instance's writes to non-persistent memory.
        serverSelectionTimeoutMS: 9000,
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
