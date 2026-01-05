// Support both standard KV environment variables and custom prefixed ones
function getRedisConfig() {
  // Try standard Vercel KV variables first
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
      type: 'vercel-kv'
    };
  }
  
  // Try custom prefixed variables (e.g., heyu_test_KV_REST_API_URL)
  const prefix = process.env.REDIS_ENV_PREFIX || 'heyu_test';
  const customUrl = process.env[`${prefix}_KV_REST_API_URL`];
  const customToken = process.env[`${prefix}_KV_REST_API_TOKEN`];
  
  if (customUrl && customToken) {
    return {
      url: customUrl,
      token: customToken,
      type: 'custom-prefix'
    };
  }
  
  return null;
}

// Use @upstash/redis for flexibility with custom env var names
let redisClient = null;

// Redis key prefix constants
// Change the prefix to isolate data between different projects
const KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'heyu_test';
export const REDIS_KEYS = {
  BOOKINGS: `${KEY_PREFIX}:bookings`,
  SERVICES: `${KEY_PREFIX}:services`,
  BLOCKED_DATES: `${KEY_PREFIX}:blocked_dates`
};

// Create Redis client based on available environment variables
async function createRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const config = getRedisConfig();
  
  if (!config) {
    throw new Error('No Redis configuration found. Please set either KV_REST_API_URL/KV_REST_API_TOKEN or heyu_test_KV_REST_API_URL/heyu_test_KV_REST_API_TOKEN');
  }

  // Use @upstash/redis for custom env var support
  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({
      url: config.url,
      token: config.token,
    });
    console.log(`✅ Redis client created using ${config.type} configuration`);
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to create Redis client:', error);
    throw error;
  }
}

// Export redis as a proxy that creates the client on first use
export const redis = new Proxy({}, {
  get: function(target, prop) {
    return async function(...args) {
      const client = await createRedisClient();
      return client[prop](...args);
    };
  }
});

// Get Redis client asynchronously (for compatibility)
export async function getRedisClientAsync() {
  try {
    return await createRedisClient();
  } catch (error) {
    console.error('❌ Failed to get Redis client:', error);
    throw error;
  }
}

// Initialize Redis client
export async function initRedisClient() {
  try {
    const config = getRedisConfig();
    
    console.log('🔍 Checking Redis environment variables:');
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      console.log(`  KV_REST_API_URL: ✅`);
      console.log(`  KV_REST_API_TOKEN: ✅`);
      console.log(`  Using: Standard Vercel KV variables`);
    } else {
      const prefix = process.env.REDIS_ENV_PREFIX || 'heyu_test';
      const customUrl = process.env[`${prefix}_KV_REST_API_URL`];
      const customToken = process.env[`${prefix}_KV_REST_API_TOKEN`];
      console.log(`  ${prefix}_KV_REST_API_URL: ${customUrl ? '✅' : '❌ Missing'}`);
      console.log(`  ${prefix}_KV_REST_API_TOKEN: ${customToken ? '✅' : '❌ Missing'}`);
      console.log(`  Using: Custom prefixed variables (${prefix})`);
    }
    
    if (!config) {
      const errorMsg = `Missing required environment variables. Please set either:
- KV_REST_API_URL and KV_REST_API_TOKEN (standard)
- OR heyu_test_KV_REST_API_URL and heyu_test_KV_REST_API_TOKEN (custom prefix)
Check Vercel Dashboard → Settings → Environment Variables`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    // Create client and test connection
    const client = await createRedisClient();
    const KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'heyu_test';
    await client.get(`${KEY_PREFIX}:test:connection`);
    console.log(`✅ Redis connection verified - Using key prefix: ${KEY_PREFIX}`);
    return client;
  } catch (error) {
    console.error('❌ Redis initialization failed:', error.message);
    // Don't throw - allow API to continue even if Redis test fails
    // The actual operations will handle errors
    try {
      return await createRedisClient();
    } catch {
      return redis;
    }
  }
}
