import { kv } from "@vercel/kv";

export const redis = kv;

// Redis key prefix constants
export const REDIS_KEYS = {
  BOOKINGS: 'heyu:bookings',
  SERVICES: 'heyu:services',
  BLOCKED_DATES: 'heyu:blocked_dates'
};

// Get Redis client asynchronously (for compatibility)
export async function getRedisClientAsync() {
  try {
    // Vercel KV is already initialized, just return it
    return redis;
  } catch (error) {
    console.error('❌ Failed to get Redis client:', error);
    throw error;
  }
}

// Initialize Redis client (no-op for Vercel KV, kept for compatibility)
export async function initRedisClient() {
  try {
    // Vercel KV is already initialized when imported
    // Test connection by doing a simple get operation
    await redis.get('heyu:test:connection');
    console.log('✅ Redis connection verified (Vercel KV)');
    return redis;
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
    // Don't throw - allow API to continue even if Redis test fails
    // The actual operations will handle errors
    return redis;
  }
}
