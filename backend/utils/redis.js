import { kv } from "@vercel/kv";

export const redis = kv;

// Redis key prefix constants
// Change the prefix to isolate data between different projects
const KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'heyu_test';
export const REDIS_KEYS = {
  BOOKINGS: `${KEY_PREFIX}:bookings`,
  SERVICES: `${KEY_PREFIX}:services`,
  BLOCKED_DATES: `${KEY_PREFIX}:blocked_dates`
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
    const KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'heyu_test';
    await redis.get(`${KEY_PREFIX}:test:connection`);
    console.log(`✅ Redis connection verified (Vercel KV) - Using prefix: ${KEY_PREFIX}`);
    return redis;
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
    // Don't throw - allow API to continue even if Redis test fails
    // The actual operations will handle errors
    return redis;
  }
}
