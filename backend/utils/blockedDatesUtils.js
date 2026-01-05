import { getRedisClientAsync, REDIS_KEYS } from './redis.js';

// Read all blocked dates
export async function readBlockedDates() {
  try {
    const client = await getRedisClientAsync();
    const data = await client.get(REDIS_KEYS.BLOCKED_DATES);
    
    if (data === null) {
      // If no data in Redis, return empty array
      return [];
    }
    
    // Parse JSON string
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    
    // If stored in old format (object with blockedDates field), extract blockedDates array
    if (typeof parsed === 'object' && parsed.blockedDates) {
      return parsed.blockedDates;
    }
    
    // If directly stored as array, return directly
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to read blocked dates data:', error);
    return [];
  }
}

// Save all blocked dates
export async function saveBlockedDates(blockedDates) {
  try {
    const client = await getRedisClientAsync();
    const data = {
      blockedDates: blockedDates,
      lastUpdated: new Date().toISOString()
    };
    // Vercel KV can handle objects directly, but JSON.stringify is safer
    await client.set(REDIS_KEYS.BLOCKED_DATES, JSON.stringify(data));
    console.log(`✅ Saved ${blockedDates.length} blocked dates to Redis`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save blocked dates data:', error);
    throw error;
  }
}

// Validate blocked date data
export function validateBlockedDate(blockedDate) {
  const errors = [];

  if (!blockedDate.date || typeof blockedDate.date !== 'string') {
    errors.push('Date is required and must be a string');
  } else {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(blockedDate.date)) {
      errors.push('Invalid date format, should be YYYY-MM-DD');
    }
  }

  if (!Array.isArray(blockedDate.times)) {
    errors.push('Times must be an array');
  } else {
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    const invalidTimes = blockedDate.times.filter(time => !timeRegex.test(time));
    if (invalidTimes.length > 0) {
      errors.push(`Invalid time format: ${invalidTimes.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}
