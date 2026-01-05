import express from 'express';
import { sendConfirmationEmail } from '../utils/emailUtils.js';
import { readBookings } from '../utils/bookingUtils.js';

const router = express.Router();

// GET /api/email/test - Test email configuration
router.get('/test', async (req, res) => {
  try {
    console.log('=== EMAIL TEST STARTED ===');
    console.log('Request received at:', new Date().toISOString());
    
    const testEmail = req.query.email || process.env.SMTP_USER;
    
    console.log('Test email address:', testEmail);
    console.log('Environment check:', {
      SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
      SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET'
    });
    
    if (!testEmail) {
      console.log('ERROR: No email provided');
      return res.status(400).json({
        success: false,
        message: 'Please provide email address as query parameter: /api/email/test?email=your@email.com'
      });
    }

    console.log('🧪 Testing email configuration...');
    
    // Check environment variables
    const config = {
      SMTP_HOST: process.env.SMTP_HOST ? '✅ Set' : '❌ Missing',
      SMTP_PORT: process.env.SMTP_PORT || '587',
      SMTP_USER: process.env.SMTP_USER ? '✅ Set' : '❌ Missing',
      SMTP_PASS: process.env.SMTP_PASS ? '✅ Set (hidden)' : '❌ Missing',
      SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || 'Not set',
    };

    console.log('Configuration:', config);

    // Try to send test email
    const testBookingData = {
      bookingId: 'TEST-' + Date.now(),
      email: testEmail,
      name: 'Test User',
      wechatName: 'Test WeChat',
      phone: '1234567890',
      service: {
        nameCn: '测试服务',
        nameEn: 'Test Service',
        duration: '2 hours',
        price: '$50'
      },
      selectedDate: new Date().toISOString().split('T')[0],
      selectedTime: '10:00'
    };

    console.log('Calling sendConfirmationEmail...');
    const result = await sendConfirmationEmail(testBookingData);
    console.log('Email send result:', JSON.stringify(result, null, 2));

    console.log('=== EMAIL TEST COMPLETED ===');
    
    res.json({
      success: result.success,
      message: result.success 
        ? 'Test email sent successfully! Check your inbox (and spam folder).' 
        : 'Failed to send test email',
      config: config,
      result: result,
      testEmail: testEmail
    });
  } catch (error) {
    console.error('=== EMAIL TEST ERROR ===');
    console.error('Test email failed:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Test email failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/email/check - Check email configuration without sending
router.get('/check', (req, res) => {
  const config = {
    SMTP_HOST: process.env.SMTP_HOST ? '✅ Set' : '❌ Missing',
    SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
    SMTP_USER: process.env.SMTP_USER ? '✅ Set' : '❌ Missing',
    SMTP_PASS: process.env.SMTP_PASS ? '✅ Set (hidden)' : '❌ Missing',
    SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || 'Not set',
    SMTP_SERVICE: process.env.SMTP_SERVICE || 'gmail (default)',
    SMTP_SECURE: process.env.SMTP_SECURE || 'false (default)',
  };

  const allSet = config.SMTP_HOST.includes('✅') && 
                 config.SMTP_USER.includes('✅') && 
                 config.SMTP_PASS.includes('✅');

  res.json({
    configured: allSet,
    config: config,
    message: allSet 
      ? 'Email service is configured. Use /api/email/test to send a test email.'
      : 'Email service is not fully configured. Please set missing environment variables.'
  });
});

// POST /api/email/send-confirmation - Send confirmation email manually
router.post('/send-confirmation', async (req, res) => {
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
      res.json({
        success: true,
        message: 'Confirmation email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
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
    res.status(500).json({
      success: false,
      message: 'Server error, unable to send email',
      error: error.message
    });
  }
});

export default router;
