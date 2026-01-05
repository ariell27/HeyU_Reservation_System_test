/**
 * Clear all booking data from Redis
 * Usage: node scripts/clear-bookings.js [--force]
 * 
 * Options:
 *   --force    Skip confirmation prompt
 */

import { redis, REDIS_KEYS } from '../utils/redis.js';
import { initRedisClient } from '../utils/redis.js';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

// Check for --force flag
const forceFlag = process.argv.includes('--force');

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function clearBookings() {
  try {
    console.log('🔄 Initializing Redis connection...');
    await initRedisClient();
    
    // Read current booking data to show statistics
    console.log('📊 Checking current booking data...');
    const currentData = await redis.get(REDIS_KEYS.BOOKINGS);
    
    let bookingCount = 0;
    if (currentData !== null) {
      try {
        const parsed = typeof currentData === 'string' ? JSON.parse(currentData) : currentData;
        if (parsed && parsed.bookings && Array.isArray(parsed.bookings)) {
          bookingCount = parsed.bookings.length;
        } else if (Array.isArray(parsed)) {
          bookingCount = parsed.length;
        }
      } catch (e) {
        console.warn('⚠️  Could not parse booking data for count');
      }
    }
    
    console.log(`\n📋 Current booking statistics:`);
    console.log(`   Total bookings: ${bookingCount}`);
    console.log(`   Redis key: ${REDIS_KEYS.BOOKINGS}`);
    
    if (bookingCount === 0) {
      console.log('\n✅ No booking data found. Nothing to clear.');
      rl.close();
      process.exit(0);
    }
    
    // Ask for confirmation unless --force flag is used
    if (!forceFlag) {
      console.log('\n⚠️  WARNING: This action will permanently delete ALL booking data!');
      const answer = await askQuestion('Are you sure you want to continue? (yes/no): ');
      rl.close();
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled.');
        process.exit(0);
      }
    } else {
      rl.close();
      console.log('\n⚠️  --force flag detected. Skipping confirmation...');
    }
    
    console.log('\n🗑️  Clearing booking data...');
    
    // Delete the bookings key
    const result = await redis.del(REDIS_KEYS.BOOKINGS);
    
    if (result === 1) {
      console.log('✅ Successfully deleted booking data from Redis');
    } else if (result === 0) {
      console.log('ℹ️  Key was not found (may have been already deleted)');
    }
    
    console.log(`   Key: ${REDIS_KEYS.BOOKINGS}`);
    console.log(`   Result: ${result} (1 = deleted, 0 = not found)`);
    
    // Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const checkData = await redis.get(REDIS_KEYS.BOOKINGS);
    if (checkData === null) {
      console.log('✅ Verification successful: Booking data is now empty');
      console.log(`   ${bookingCount} booking(s) have been permanently deleted.`);
    } else {
      console.warn('⚠️  Warning: Data still exists after deletion');
      console.warn('   This should not happen. Please check manually.');
    }
    
    console.log('\n✅ Operation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to clear booking data:');
    console.error('   Error:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    
    // Check if it's a connection error
    if (error.message.includes('KV_REST_API') || error.message.includes('Missing required')) {
      console.error('\n💡 Tip: Make sure you have set the following environment variables:');
      console.error('   - KV_REST_API_URL');
      console.error('   - KV_REST_API_TOKEN');
      console.error('\n   Or create a .env file in the backend directory with these values.');
    }
    
    rl.close();
    process.exit(1);
  }
}

// Run the script
clearBookings();

