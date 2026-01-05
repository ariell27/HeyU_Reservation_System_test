// Vercel serverless function - Get single booking by ID
import { readBookings } from '../../utils/bookingUtils.js';
import { initRedisClient } from '../../utils/redis.js';

let redisInitialized = false;

async function initializeRedis() {
  if (!redisInitialized) {
    try {
      await initRedisClient();
      redisInitialized = true;
    } catch (error) {
      console.warn('⚠️ Redis initialization failed:', error.message);
    }
  }
}

export default async function handler(req, res) {
  await initializeRedis();

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { bookingId } = req.query;
    const bookings = await readBookings();
    const booking = bookings.find(b => b.bookingId === bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.json({
      success: true,
      booking: booking
    });
  } catch (error) {
    console.error('Failed to get booking details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, unable to get booking details',
      error: error.message
    });
  }
}

