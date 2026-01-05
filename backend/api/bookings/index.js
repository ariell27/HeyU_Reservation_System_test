// Vercel serverless function - Bookings API
import {
  readBookings,
  saveBookings,
  generateBookingId,
  validateBookingData
} from '../../utils/bookingUtils.js';
import { sendConfirmationEmail } from '../../utils/emailUtils.js';
import { initRedisClient, redis, REDIS_KEYS } from '../../utils/redis.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // POST /api/bookings - Create new booking
    if (req.method === 'POST') {
      const bookingData = req.body;

      // Validate data
      const validation = validateBookingData(bookingData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Data validation failed',
          errors: validation.errors
        });
      }

      // Read existing bookings
      const bookings = await readBookings();

      // Create new booking object
      let selectedDateStr = bookingData.selectedDate;
      if (selectedDateStr instanceof Date) {
        const year = selectedDateStr.getFullYear();
        const month = String(selectedDateStr.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDateStr.getDate()).padStart(2, '0');
        selectedDateStr = `${year}-${month}-${day}`;
      } else if (typeof selectedDateStr === 'string' && selectedDateStr.includes('T')) {
        selectedDateStr = selectedDateStr.split('T')[0];
      }

      const newBooking = {
        bookingId: generateBookingId(),
        service: bookingData.service,
        selectedDate: selectedDateStr,
        selectedTime: bookingData.selectedTime,
        name: bookingData.name.trim(),
        wechatName: bookingData.wechatName.trim(),
        email: bookingData.email.trim(),
        phone: bookingData.phone.trim(),
        wechat: bookingData.wechat ? bookingData.wechat.trim() : '',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      // Add to bookings list
      bookings.push(newBooking);

      // Save to Redis
      await saveBookings(bookings);

      // Send confirmation email (don't wait for it, send in background)
      sendConfirmationEmail({
        ...newBooking,
        bookingId: newBooking.bookingId
      }).then(result => {
        if (result.success) {
          console.log('✅ Confirmation email sent successfully for booking:', newBooking.bookingId);
        } else {
          console.error('❌ Failed to send confirmation email for booking:', newBooking.bookingId, result.error || result.message);
        }
      }).catch(error => {
        console.error('❌ Error sending confirmation email for booking:', newBooking.bookingId, error);
      });

      return res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: newBooking
      });
    }

    // GET /api/bookings - Get all bookings
    if (req.method === 'GET') {
      const { status, date } = req.query;
      let bookings = await readBookings();

      // Filter by status
      if (status) {
        bookings = bookings.filter(booking => booking.status === status);
      }

      // Filter by date
      if (date) {
        bookings = bookings.filter(booking => {
          const bookingDateStr = booking.selectedDate.includes('T')
            ? booking.selectedDate.split('T')[0]
            : booking.selectedDate;
          return bookingDateStr === date;
        });
      }

      // Sort by creation time descending (newest first)
      bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.json({
        success: true,
        count: bookings.length,
        bookings: bookings
      });
    }

    // DELETE /api/bookings?action=clear-all - Clear all booking data
    if (req.method === 'DELETE') {
      const { action } = req.query;
      
      // Only allow clearing all data with explicit action parameter
      if (action === 'clear-all') {
        console.log('🗑️  Clear all bookings request received');
        
        // Get count before deletion for reporting
        const bookings = await readBookings();
        const countBefore = bookings.length;
        
        // Delete the bookings key
        const result = await redis.del(REDIS_KEYS.BOOKINGS);
        
        // Verify deletion
        const checkData = await redis.get(REDIS_KEYS.BOOKINGS);
        const isCleared = checkData === null;
        
        if (result === 1 && isCleared) {
          console.log(`✅ Successfully cleared ${countBefore} booking(s) from Redis`);
          return res.status(200).json({
            success: true,
            message: `All booking data has been cleared successfully.`,
            deletedCount: countBefore,
            key: REDIS_KEYS.BOOKINGS,
            verified: true,
            timestamp: new Date().toISOString()
          });
        } else {
          console.warn('⚠️  Warning: Deletion may not have completed successfully');
          return res.status(500).json({
            success: false,
            message: 'Deletion completed but verification failed',
            deletedCount: countBefore,
            verified: false
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use ?action=clear-all to clear all bookings.'
        });
      }
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    console.error('Bookings API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

