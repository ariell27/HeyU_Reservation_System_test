/**
 * Data migration script: Migrate JSON file data to Redis
 * Usage: node scripts/migrate-to-redis.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initRedisClient, getRedisClientAsync, REDIS_KEYS } from '../utils/redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const BLOCKED_DATES_FILE = path.join(DATA_DIR, 'blockedDates.json');

async function migrateBookings() {
  try {
    if (!fs.existsSync(BOOKINGS_FILE)) {
      console.log('⚠️  bookings.json file does not exist, skipping migration');
      return;
    }

    const fileData = fs.readFileSync(BOOKINGS_FILE, 'utf8');
    const json = JSON.parse(fileData);
    const bookings = json.bookings || [];

    if (bookings.length === 0) {
      console.log('⚠️  No data in bookings.json, skipping migration');
      return;
    }

    const client = await getRedisClientAsync();
    const data = {
      bookings: bookings,
      lastUpdated: new Date().toISOString(),
      migratedFrom: 'bookings.json',
      migratedAt: new Date().toISOString()
    };
    
    await client.set(REDIS_KEYS.BOOKINGS, JSON.stringify(data));
    console.log(`✅ Successfully migrated ${bookings.length} booking records to Redis`);
  } catch (error) {
    console.error('❌ Failed to migrate booking data:', error);
  }
}

async function migrateServices() {
  try {
    if (!fs.existsSync(SERVICES_FILE)) {
      console.log('⚠️  services.json file does not exist, skipping migration');
      return;
    }

    const fileData = fs.readFileSync(SERVICES_FILE, 'utf8');
    const json = JSON.parse(fileData);
    const services = json.services || [];

    if (services.length === 0) {
      console.log('⚠️  No data in services.json, skipping migration');
      return;
    }

    const client = await getRedisClientAsync();
    const data = {
      services: services,
      lastUpdated: new Date().toISOString(),
      migratedFrom: 'services.json',
      migratedAt: new Date().toISOString()
    };
    
    await client.set(REDIS_KEYS.SERVICES, JSON.stringify(data));
    console.log(`✅ Successfully migrated ${services.length} service records to Redis`);
  } catch (error) {
    console.error('❌ Failed to migrate service data:', error);
  }
}

async function migrateBlockedDates() {
  try {
    if (!fs.existsSync(BLOCKED_DATES_FILE)) {
      console.log('⚠️  blockedDates.json file does not exist, skipping migration');
      return;
    }

    const fileData = fs.readFileSync(BLOCKED_DATES_FILE, 'utf8');
    const json = JSON.parse(fileData);
    const blockedDates = json.blockedDates || [];

    if (blockedDates.length === 0) {
      console.log('⚠️  No data in blockedDates.json, skipping migration');
      return;
    }

    const client = await getRedisClientAsync();
    const data = {
      blockedDates: blockedDates,
      lastUpdated: new Date().toISOString(),
      migratedFrom: 'blockedDates.json',
      migratedAt: new Date().toISOString()
    };
    
    await client.set(REDIS_KEYS.BLOCKED_DATES, JSON.stringify(data));
    console.log(`✅ Successfully migrated ${blockedDates.length} blocked date records to Redis`);
  } catch (error) {
    console.error('❌ Failed to migrate blocked dates data:', error);
  }
}

async function main() {
  console.log('🚀 Starting data migration...\n');

  // Initialize and test Redis connection
  try {
    await initRedisClient();
    const client = await getRedisClientAsync();
    const testKey = 'heyu:migration:test';
    await client.set(testKey, 'test', { ex: 1 });
    const testValue = await client.get(testKey);
    if (testValue !== 'test') {
      throw new Error('Redis connection test failed');
    }
    console.log('✅ Redis connection OK\n');
  } catch (error) {
    console.error('❌ Redis connection failed, please check environment variables');
    console.error('Error:', error.message);
    process.exit(1);
  }

  // Execute migration
  await migrateBookings();
  await migrateServices();
  await migrateBlockedDates();

  console.log('\n✨ Data migration completed!');
  console.log('💡 Tip: After migration, you can optionally delete the JSON files in the data directory');
}

main().catch(console.error);
