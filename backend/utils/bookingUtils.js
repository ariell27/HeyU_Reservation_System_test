import { getRedisClientAsync, REDIS_KEYS } from './redis.js';

// Read all bookings
export async function readBookings() {
  try {
    const client = await getRedisClientAsync();
    const data = await client.get(REDIS_KEYS.BOOKINGS);
    
    if (data === null) {
      // If no data in Redis, return empty array
      return [];
    }
    
    // Parse JSON string
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    
    // If stored in old format (object with bookings field), extract bookings array
    if (typeof parsed === 'object' && parsed.bookings) {
      return parsed.bookings;
    }
    
    // If directly stored as array, return directly
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to read booking data:', error);
    return [];
  }
}

// Save all bookings
export async function saveBookings(bookings) {
  try {
    const client = await getRedisClientAsync();
    const data = {
      bookings: bookings,
      lastUpdated: new Date().toISOString()
    };
    // Vercel KV can handle objects directly, but JSON.stringify is safer
    await client.set(REDIS_KEYS.BOOKINGS, JSON.stringify(data));
    console.log(`✅ Saved ${bookings.length} bookings to Redis`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save booking data:', error);
    throw error;
  }
}

// Generate unique booking ID
export function generateBookingId() {
  return `BK${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
}

// Validate booking data
export function validateBookingData(bookingData) {
  const errors = [];

  if (!bookingData.service || !bookingData.service.id) {
    errors.push('Service information is required');
  }

  if (!bookingData.selectedDate) {
    errors.push('Date is required');
  } else {
    // Validate date format: should be YYYY-MM-DD format
    const dateStr = bookingData.selectedDate instanceof Date
      ? bookingData.selectedDate.toISOString().split('T')[0]
      : bookingData.selectedDate.split('T')[0]; // If ISO string, extract date part
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      errors.push('Invalid date format, should be YYYY-MM-DD');
    }
  }

  if (!bookingData.selectedTime) {
    errors.push('Time is required');
  }

  if (!bookingData.name || !bookingData.name.trim()) {
    errors.push('Name is required');
  }

  if (!bookingData.wechatName || !bookingData.wechatName.trim()) {
    errors.push('WeChat name is required');
  }

  if (!bookingData.email || !bookingData.email.trim()) {
    errors.push('Email address is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.email)) {
      errors.push('Invalid email address format');
    }
  }

  if (!bookingData.phone || !bookingData.phone.trim()) {
    errors.push('Phone number is required');
  } else {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const digitsOnly = bookingData.phone.replace(/\D/g, '');
    if (!phoneRegex.test(bookingData.phone) || digitsOnly.length < 8) {
      errors.push('Invalid phone number format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}
