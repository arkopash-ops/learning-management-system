import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error('Please define MONGODB_URI in .env.local');

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;       // mongoose instance
        promise: Promise<typeof mongoose> | null;       // connection promise
    } | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };

export async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            dbName: 'learning-management-system',
        });
    }

    cached.conn = await cached.promise;
    global.mongooseCache = cached;

    return cached.conn;
}
