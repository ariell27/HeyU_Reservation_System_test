/**
 * Clear all booking data via existing API
 * This script uses the existing bookings API to clear data
 * Usage: node scripts/clear-bookings-via-api.js
 */

import { redis, REDIS_KEYS } from '../utils/redis.js';
import { initRedisClient } from '../utils/redis.js';

async function clearBookings() {
  try {
    console.log('🔄 Initializing Redis connection...');
    await initRedisClient();
    
    console.log('🗑️  Clearing booking data...');
    
    // Delete the bookings key
    const result = await redis.del(REDIS_KEYS.BOOKINGS);
    
    console.log('✅ Successfully cleared all booking data from Redis');
    console.log(`   Key deleted: ${REDIS_KEYS.BOOKINGS}`);
    console.log(`   Result: ${result} (1 = deleted, 0 = not found)`);
    
    // Verify deletion
    const checkData = await redis.get(REDIS_KEYS.BOOKINGS);
    if (checkData === null) {
      console.log('✅ Verification: Booking data is now empty');
    } else {
      console.warn('⚠️  Warning: Data still exists after deletion');
      console.warn('   Data:', checkData);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear booking data:', error);
    console.error('   Error details:', error.message);
    process.exit(1);
  }
}

// Run the script
clearBookings();

