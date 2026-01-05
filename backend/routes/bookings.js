import express from 'express';
import {
  readBookings,
  saveBookings,
  generateBookingId,
  validateBookingData
} from '../utils/bookingUtils.js';
import { sendConfirmationEmail } from '../utils/emailUtils.js';

const router = express.Router();

// POST /api/bookings - Create new booking
router.post('/', async (req, res) => {
  try {
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
    // Ensure date format is local date string (YYYY-MM-DD) to avoid timezone issues
    let selectedDateStr = bookingData.selectedDate;
    
    // If Date object, convert to local date string
    if (selectedDateStr instanceof Date) {
      const year = selectedDateStr.getFullYear();
      const month = String(selectedDateStr.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDateStr.getDate()).padStart(2, '0');
      selectedDateStr = `${year}-${month}-${day}`;
    }
    // If ISO string, extract date part
    else if (typeof selectedDateStr === 'string' && selectedDateStr.includes('T')) {
      selectedDateStr = selectedDateStr.split('T')[0];
    }
    // If already YYYY-MM-DD format, use directly
    // Otherwise keep as is (let validation function handle it)

    const newBooking = {
      bookingId: generateBookingId(),
      service: bookingData.service,
      selectedDate: selectedDateStr, // Store as local date string
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
      // Don't fail the booking creation if email fails
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: newBooking
    });
  } catch (error) {
    console.error('Failed to create booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to create booking',
      error: error.message
    });
  }
});

// GET /api/bookings - Get all bookings
router.get('/', async (req, res) => {
  try {
    const { status, date } = req.query;
    let bookings = await readBookings();

    // Filter by status
    if (status) {
      bookings = bookings.filter(booking => booking.status === status);
    }

    // Filter by date
    if (date) {
      bookings = bookings.filter(booking => {
        // If storedDate is ISO string, extract date part; if YYYY-MM-DD, use directly
        const bookingDateStr = booking.selectedDate.includes('T')
          ? booking.selectedDate.split('T')[0]
          : booking.selectedDate;
        return bookingDateStr === date;
      });
    }

    // Sort by creation time descending (newest first)
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: bookings.length,
      bookings: bookings
    });
  } catch (error) {
    console.error('Failed to get bookings list:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to get bookings list',
      error: error.message
    });
  }
});

// GET /api/bookings/:bookingId - Get single booking by ID
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const bookings = await readBookings();
    const booking = bookings.find(b => b.bookingId === bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking: booking
    });
  } catch (error) {
    console.error('Failed to get booking details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to get booking details',
      error: error.message
    });
  }
});

export default router;
