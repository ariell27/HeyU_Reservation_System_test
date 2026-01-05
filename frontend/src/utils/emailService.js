/**
 * Email service
 * Sends confirmation emails via backend API
 */

// Get API URL and remove trailing slash
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = rawApiUrl.replace(/\/+$/, ''); // Remove trailing slashes

// Debug: Log API URL
if (typeof window !== 'undefined') {
  console.log('📧 Email Service API_URL:', API_URL);
}

/**
 * Send confirmation email
 * @param {Object} bookingData - Booking data
 * @returns {Promise<boolean>} Whether email was sent successfully
 */
export const sendConfirmationEmail = async (bookingData) => {
  console.log('📧 sendConfirmationEmail called with:', {
    email: bookingData.email,
    bookingId: bookingData.bookingId,
    API_URL: API_URL
  });

  try {
    const url = `${API_URL}/api/email/send-confirmation`;
    console.log('📧 Calling email API:', url);
    
    // Call backend API to send email
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingData: bookingData,
      }),
    });

    console.log('📧 Email API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Email sent successfully:', data);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('❌ Failed to send email:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      // Don't throw error, just log it - email failure shouldn't block booking
      return false;
    }
  } catch (error) {
    // If backend API is not available, just log and return false
    // Email sending is handled by backend automatically when booking is created
    console.error('❌ Email service error:', {
      message: error.message,
      stack: error.stack,
      API_URL: API_URL
    });
    return false;
  }
};

/**
 * Generate email content
 * @param {Object} bookingData - Booking data
 * @returns {string} Email HTML content
 */
    const generateEmailContent = (bookingData) => {
      const { service, selectedDate, selectedTime, selectedStaff, name, email, phone, wechat } = bookingData;
  
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2c2c2c; }
        .content { background-color: #f8f8f8; padding: 20px; border-radius: 8px; }
        .detail-item { margin-bottom: 15px; }
        .label { font-weight: bold; color: #666; }
        .value { color: #2c2c2c; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">HeyU禾屿</div>
        </div>
        <div class="content">
          <h2>Booking Confirmation</h2>
          <p>Thank you for choosing HeyU! Your booking has been successfully confirmed.</p>
          
          <div class="detail-item">
            <span class="label">Service:</span>
            <span class="value">${service.nameCn} | ${service.nameEn}</span>
          </div>
          <div class="detail-item">
            <span class="label">Staff:</span>
            <span class="value">${selectedStaff.name}</span>
          </div>
          <div class="detail-item">
            <span class="label">Date:</span>
            <span class="value">${formatDate(selectedDate)}</span>
          </div>
          <div class="detail-item">
            <span class="label">Time:</span>
            <span class="value">${formatTime(selectedTime)}</span>
          </div>
          <div class="detail-item">
            <span class="label">Duration:</span>
            <span class="value">${service.duration}</span>
          </div>
          <div class="detail-item">
            <span class="label">Price:</span>
            <span class="value">${service.price}</span>
          </div>
          <div class="detail-item">
            <span class="label">Name:</span>
            <span class="value">${name || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="label">Phone:</span>
            <span class="value">${phone}</span>
          </div>
          <div class="detail-item">
            <span class="label">Email:</span>
            <span class="value">${email}</span>
          </div>
          ${wechat ? `<div class="detail-item">
            <span class="label">WeChat:</span>
            <span class="value">${wechat}</span>
          </div>` : ''}
          
          <p style="margin-top: 20px;">
            We will contact you 24 hours before your appointment via phone or email to confirm.<br>
            If you have any questions, please feel free to contact us.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

