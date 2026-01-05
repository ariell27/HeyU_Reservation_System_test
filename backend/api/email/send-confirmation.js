// Vercel serverless function - Send confirmation email
import { sendConfirmationEmail } from '../../utils/emailUtils.js';
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    console.log('=== SEND CONFIRMATION EMAIL REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { bookingId, bookingData } = req.body;

    let booking = bookingData;

    // If bookingId is provided, fetch booking from database
    if (bookingId && !bookingData) {
      console.log('Fetching booking by ID:', bookingId);
      const bookings = await readBookings();
      booking = bookings.find(b => b.bookingId === bookingId);

      if (!booking) {
        console.log('Booking not found:', bookingId);
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
    }

    if (!booking) {
      console.log('ERROR: No booking data provided');
      return res.status(400).json({
        success: false,
        message: 'Booking data or bookingId is required'
      });
    }

    console.log('Sending email for booking:', booking.bookingId || 'N/A', 'to:', booking.email);

    // Send email
    const result = await sendConfirmationEmail(booking);
    console.log('Email send result:', JSON.stringify(result, null, 2));

    if (result.success) {
      return res.json({
        success: true,
        message: 'Confirmation email sent successfully',
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error || result.message,
        details: result
      });
    }
  } catch (error) {
    console.error('=== SEND EMAIL ERROR ===');
    console.error('Failed to send confirmation email:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Server error, unable to send email',
      error: error.message
    });
  }
}

