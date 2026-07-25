import mongoose from 'mongoose';
const MONGODB_URI = process.env.MONGODB_URI;
export async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not set in environment variables');
    }
    try {
        await mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        });
        console.log('[v0] Connected to MongoDB');
        return mongoose;
    }
    catch (error) {
        console.error('[v0] MongoDB connection error:', error);
        throw error;
    }
}
