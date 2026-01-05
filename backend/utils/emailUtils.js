/**
 * Email utility functions
 * Uses nodemailer to send confirmation emails
 */

// Generate email HTML content
export function generateEmailContent(bookingData) {
  const { service, selectedDate, selectedTime, name, email, phone, wechat, wechatName, bookingId } = bookingData;

  const formatDate = (date) => {
    if (!date) return '';
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const d = new Date(dateStr + 'T00:00:00');
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return d.toLocaleDateString('en-US', options);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background-color: #ffffff;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e5e5;
        }
        .logo { 
          font-size: 28px; 
          font-weight: bold; 
          color: #2c2c2c; 
          margin-bottom: 10px;
        }
        .content { 
          background-color: #f8f8f8; 
          padding: 25px; 
          border-radius: 8px; 
          margin-bottom: 20px;
        }
        .success-badge {
          background-color: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          display: inline-block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        h2 {
          color: #2c2c2c;
          margin-top: 0;
        }
        .detail-item { 
          margin-bottom: 15px; 
          padding-bottom: 15px;
          border-bottom: 1px solid #e5e5e5;
        }
        .detail-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .label { 
          font-weight: 600; 
          color: #666; 
          font-size: 14px;
          margin-bottom: 5px;
        }
        .value { 
          color: #2c2c2c; 
          font-size: 16px;
        }
        .booking-id {
          background-color: #e5e5e5;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          color: #666;
        }
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          font-size: 12px; 
          color: #999; 
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
        }
        .note {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin-top: 20px;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">HeyU 禾屿</div>
          <div class="success-badge">✓ Booking Confirmed</div>
        </div>
        <div class="content">
          <h2>Booking Confirmation</h2>
          <p>Thank you for choosing HeyU 禾屿! Your booking has been successfully confirmed.</p>
          
          <div class="detail-item">
            <div class="label">Service</div>
            <div class="value">${service?.nameCn || ''} | ${service?.nameEn || ''}</div>
          </div>
          
          <div class="detail-item">
            <div class="label">Date</div>
            <div class="value">${formatDate(selectedDate)}</div>
          </div>
          
          <div class="detail-item">
            <div class="label">Time</div>
            <div class="value">${formatTime(selectedTime)}</div>
          </div>
          
          <div class="detail-item">
            <div class="label">Duration</div>
            <div class="value">${service?.duration || 'N/A'}</div>
          </div>
          
          <div class="detail-item">
            <div class="label">Price</div>
            <div class="value">${service?.price || 'N/A'}</div>
          </div>
          
          <div class="detail-item">
            <div class="label">Name</div>
            <div class="value">${name || 'N/A'}</div>
          </div>
          
          <div class="detail-item">
            <div class="label">WeChat Name</div>
            <div class="value">${wechatName || 'N/A'}</div>
          </div>
          
          <div class="detail-item">
            <div class="label">Phone</div>
            <div class="value">${phone || 'N/A'}</div>
          </div>
          
          <div class="detail-item">
            <div class="label">Email</div>
            <div class="value">${email || 'N/A'}</div>
          </div>
          
          ${wechat ? `<div class="detail-item">
            <div class="label">WeChat ID</div>
            <div class="value">${wechat}</div>
          </div>` : ''}
        </div>
        <div class="footer">
          <p>This is an automated email, please do not reply.</p>
          <p>HeyU 禾屿 - Professional Nail Services</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send confirmation email
export async function sendConfirmationEmail(bookingData) {
  console.log('=== sendConfirmationEmail CALLED ===');
  console.log('Time:', new Date().toISOString());
  console.log('Booking data:', {
    email: bookingData.email,
    bookingId: bookingData.bookingId,
    name: bookingData.name
  });
  
  try {
    // Check if email service is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    console.log('📧 Email sending attempt:', {
      hasHost: !!smtpHost,
      hasUser: !!smtpUser,
      hasPass: !!smtpPass,
      recipient: bookingData.email,
      bookingId: bookingData.bookingId
    });
    
    console.log('Environment variables:', {
      SMTP_HOST: smtpHost || 'NOT SET',
      SMTP_USER: smtpUser || 'NOT SET',
      SMTP_PASS: smtpPass ? 'SET (hidden)' : 'NOT SET',
      SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
      SMTP_SERVICE: process.env.SMTP_SERVICE || 'NOT SET'
    });

    if (!smtpHost || !smtpUser || !smtpPass) {
      const missing = [];
      if (!smtpHost) missing.push('SMTP_HOST');
      if (!smtpUser) missing.push('SMTP_USER');
      if (!smtpPass) missing.push('SMTP_PASS');
      console.warn('❌ Email service not configured. Missing:', missing.join(', '));
      return { success: false, message: `Email service not configured. Missing: ${missing.join(', ')}` };
    }

    const nodemailer = await import('nodemailer');
    
    // Create transporter with Gmail-specific settings
    const transporterConfig = {
      service: process.env.SMTP_SERVICE || 'gmail',
      host: smtpHost || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    console.log('📧 Creating transporter with config:', {
      service: transporterConfig.service,
      host: transporterConfig.host,
      port: transporterConfig.port,
      secure: transporterConfig.secure,
      user: smtpUser
    });

    const transporter = nodemailer.default.createTransport(transporterConfig);

    // Verify connection
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError.message);
      return { success: false, error: `SMTP verification failed: ${verifyError.message}` };
    }

    // Email content
    const htmlContent = generateEmailContent(bookingData);
    const subject = `HeyU 禾屿 - Booking Confirmation #${bookingData.bookingId || ''}`;
    const fromEmail = process.env.SMTP_FROM || smtpUser;
    const toEmail = bookingData.email;

    console.log('📧 Sending email:', {
      from: fromEmail,
      to: toEmail,
      subject: subject
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"HeyU 禾屿" <${fromEmail}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent,
    });

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    };
  } catch (error) {
    console.error('❌ Failed to send email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      details: error.response || error.command
    };
  }
}

