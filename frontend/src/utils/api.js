/**
 * API Service Utilities
 * Unified management of all backend API calls
 */

// Get API URL and remove trailing slash
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = rawApiUrl.replace(/\/+$/, ''); // Remove trailing slashes

// Debug: Log API URL on module load
console.log('🔗 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_URL: API_URL,
  mode: import.meta.env.MODE,
  isProduction: import.meta.env.PROD
});

/**
 * Get all services
 * @param {string} category - Optional, filter by category
 * @returns {Promise<Array>} Service list
 */
export async function getServices(category = null) {
  try {
    const url = category 
      ? `${API_URL}/api/services?category=${encodeURIComponent(category)}`
      : `${API_URL}/api/services`;
    
    console.log('📡 Fetching services from:', url);
    console.log('📡 API_URL:', API_URL);
    console.log('📡 VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('📡 Full URL:', url);
    
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch services: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Services loaded:', data.services?.length || 0, 'services');
    return data.services || [];
  } catch (error) {
    console.error('❌ Failed to fetch service list:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      API_URL: API_URL,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      isNetworkError: error.name === 'TypeError' && error.message.includes('fetch'),
      isAbortError: error.name === 'AbortError'
    });
    
    // Provide more helpful error messages
    if (error.name === 'AbortError') {
      throw new Error('Request timeout, please check network connection or if backend service is running');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Unable to connect to backend server. Please check:\n1. Is VITE_API_URL correctly set: ${API_URL}\n2. Is backend service running\n3. Is network connection normal`);
    }
    
    throw error;
  }
}

/**
 * Get a single service by ID
 * @param {number} serviceId - Service ID
 * @returns {Promise<Object>} Service object
 */
export async function getServiceById(serviceId) {
  try {
    const response = await fetch(`${API_URL}/api/services/${serviceId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch service: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.service;
  } catch (error) {
    console.error('Failed to fetch service details:', error);
    throw error;
  }
}

/**
 * Create or update a service
 * @param {Object} serviceData - Service data
 * @returns {Promise<Object>} Saved service object
 */
export async function saveService(serviceData) {
  try {
    const response = await fetch(`${API_URL}/api/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save service');
    }
    
    const data = await response.json();
    return data.service;
  } catch (error) {
    console.error('Failed to save service:', error);
    throw error;
  }
}

/**
 * Create a booking
 * @param {Object} bookingData - Booking data
 * @returns {Promise<Object>} Created booking object
 */
export async function createBooking(bookingData) {
  try {
    const response = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create booking');
    }
    
    const data = await response.json();
    return data.booking;
  } catch (error) {
    console.error('Failed to create booking:', error);
    throw error;
  }
}

/**
 * Get all bookings
 * @param {Object} filters - Filter conditions { status, date }
 * @returns {Promise<Array>} Booking list
 */
export async function getBookings(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.date) params.append('date', filters.date);
    
    const url = `${API_URL}/api/bookings${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch booking list: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.bookings || [];
  } catch (error) {
    console.error('Failed to fetch booking list:', error);
    throw error;
  }
}

/**
 * Get a single booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Booking object
 */
export async function getBookingById(bookingId) {
  try {
    const response = await fetch(`${API_URL}/api/bookings/${bookingId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch booking: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.booking;
  } catch (error) {
    console.error('Failed to fetch booking details:', error);
    throw error;
  }
}

/**
 * Get all blocked dates
 * @returns {Promise<Array>} Blocked dates list
 */
export async function getBlockedDates() {
  try {
    const response = await fetch(`${API_URL}/api/blocked-dates`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blocked dates: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.blockedDates || [];
  } catch (error) {
    console.error('Failed to fetch blocked dates list:', error);
    throw error;
  }
}

/**
 * Save blocked date (create or update)
 * @param {Object} blockedDate - Blocked date data { date: "YYYY-MM-DD", times: ["10:00", "14:30"] }
 * @returns {Promise<Object>} Saved blocked date object
 */
export async function saveBlockedDate(blockedDate) {
  try {
    const response = await fetch(`${API_URL}/api/blocked-dates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blockedDate),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save blocked date');
    }
    
    const data = await response.json();
    return data.blockedDate;
  } catch (error) {
    console.error('Failed to save blocked date:', error);
    throw error;
  }
}

/**
 * Delete blocked date for entire day
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<void>}
 */
export async function deleteBlockedDate(date) {
  try {
    const response = await fetch(`${API_URL}/api/blocked-dates/${date}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete blocked date');
    }
  } catch (error) {
    console.error('Failed to delete blocked date:', error);
    throw error;
  }
}

/**
 * Delete blocked time slot
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {string} time - Time string (HH:MM)
 * @returns {Promise<void>}
 */
export async function deleteBlockedTime(date, time) {
  try {
    const response = await fetch(`${API_URL}/api/blocked-dates/${date}/times/${time}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete blocked time slot');
    }
  } catch (error) {
    console.error('Failed to delete blocked time slot:', error);
    throw error;
  }
}


