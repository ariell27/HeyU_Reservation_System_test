// Vercel serverless function - Initialize data to Redis
import { saveServices } from '../utils/serviceUtils.js';
import { saveBookings } from '../utils/bookingUtils.js';
import { saveBlockedDates } from '../utils/blockedDatesUtils.js';
import { initRedisClient } from '../utils/redis.js';

// Default services data
const DEFAULT_SERVICES = [
  {
    "id": 1,
    "nameCn": "纯色/跳色",
    "nameEn": "Solid Color/Accent Color",
    "duration": "3小时",
    "durationEn": "3 hrs",
    "price": "$55",
    "category": "本甲",
    "description": "Classic solid color or accent color design on natural nails.",
    "descriptionCn": "经典纯色或跳色设计，适合日常搭配。"
  },
  {
    "id": 2,
    "nameCn": "猫眼",
    "nameEn": "Cat Eye",
    "duration": "3小时",
    "durationEn": "3 hrs",
    "price": "$60",
    "category": "本甲",
    "description": "Magnetic cat eye effect that creates a mesmerizing look.",
    "descriptionCn": "磁性猫眼效果，打造迷人光泽。"
  },
  {
    "id": 3,
    "nameCn": "渐变",
    "nameEn": "Gradient",
    "duration": "3小时",
    "durationEn": "3 hrs",
    "price": "$60",
    "category": "本甲",
    "description": "Beautiful gradient color transition for a modern look.",
    "descriptionCn": "优雅的渐变色过渡，展现时尚魅力。"
  },
  {
    "id": 4,
    "nameCn": "魔镜粉/极光粉",
    "nameEn": "Mirror Powder/Aurora Powder",
    "duration": "3小时",
    "durationEn": "3 hrs",
    "price": "+$40",
    "category": "本甲",
    "description": "Add mirror or aurora powder effect for extra shimmer and shine.",
    "descriptionCn": "添加魔镜粉或极光粉效果，增加闪亮光泽。",
    "isAddOn": true
  },
  {
    "id": 5,
    "nameCn": "法式",
    "nameEn": "French",
    "duration": "3小时",
    "durationEn": "3 hrs",
    "price": "+$50",
    "category": "本甲",
    "description": "Classic French manicure design for timeless elegance.",
    "descriptionCn": "经典法式美甲设计，展现永恒优雅。",
    "isAddOn": true
  },
  {
    "id": 6,
    "nameCn": "半贴/浅贴/高位半贴",
    "nameEn": "Half Tip/Shallow Tip/High Half Tip",
    "duration": "5小时",
    "durationEn": "5 hrs",
    "price": "$65",
    "category": "延长",
    "description": "Professional nail extension with half tip application.",
    "descriptionCn": "专业指甲延长服务，使用半贴技术。"
  },
  {
    "id": 7,
    "nameCn": "延长款式",
    "nameEn": "Extension Styles",
    "duration": "5小时",
    "durationEn": "5 hrs",
    "price": "$55起",
    "category": "延长",
    "description": "Custom extension styles with rhinestones, ornaments, and materials included.",
    "descriptionCn": "定制延长款式，含钻、各类饰品、各类素材等，不加收额外费用。"
  },
  {
    "id": 8,
    "nameCn": "卸甲 - 本甲",
    "nameEn": "Removal - Basic Nails",
    "price": "$15",
    "category": "卸甲",
    "description": "Safe and gentle removal of polish from natural nails.",
    "descriptionCn": "安全温和地卸除本甲上的指甲油。"
  },
  {
    "id": 9,
    "nameCn": "卸甲 - 延长",
    "nameEn": "Removal - Extension",
    "price": "$20",
    "category": "卸甲",
    "description": "Professional removal of nail extensions.",
    "descriptionCn": "专业卸除延长甲。"
  }
];

let redisInitialized = false;

async function initializeRedis() {
  if (!redisInitialized) {
    try {
      await initRedisClient();
      redisInitialized = true;
    } catch (error) {
      console.warn('⚠️ Redis initialization failed:', error.message);
      throw error;
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
      message: 'Method not allowed. Use POST to initialize data.'
    });
  }

  try {
    console.log('🚀 Starting data initialization...');
    const { type, data } = req.body || {};
    
    const results = {
      services: { success: false, count: 0, error: null },
      bookings: { success: false, count: 0, error: null },
      blockedDates: { success: false, count: 0, error: null }
    };

    // Initialize Services
    try {
      let services = [];
      
      if (type === 'services' && data && Array.isArray(data)) {
        // Use data from request body
        services = data;
        console.log('📖 Using services from request body');
      } else {
        // Use default services
        services = DEFAULT_SERVICES;
        console.log('📖 Using default services data');
      }
      
      if (services.length > 0) {
        await saveServices(services);
        results.services = { success: true, count: services.length };
        console.log(`✅ Initialized ${services.length} services`);
      } else {
        console.log('⚠️ No services to initialize');
      }
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      results.services.error = error.message;
    }

    // Initialize Bookings (if provided)
    if (type === 'bookings' && data && Array.isArray(data)) {
      try {
        if (data.length > 0) {
          await saveBookings(data);
          results.bookings = { success: true, count: data.length };
          console.log(`✅ Initialized ${data.length} bookings`);
        }
      } catch (error) {
        console.error('❌ Failed to initialize bookings:', error);
        results.bookings.error = error.message;
      }
    }

    // Initialize Blocked Dates (if provided)
    if (type === 'blockedDates' && data && Array.isArray(data)) {
      try {
        if (data.length > 0) {
          await saveBlockedDates(data);
          results.blockedDates = { success: true, count: data.length };
          console.log(`✅ Initialized ${data.length} blocked dates`);
        }
      } catch (error) {
        console.error('❌ Failed to initialize blocked dates:', error);
        results.blockedDates.error = error.message;
      }
    }

    const allSuccess = results.services.success || 
                      results.bookings.success || 
                      results.blockedDates.success;

    return res.json({
      success: allSuccess,
      message: 'Data initialization completed',
      results: results
    });
  } catch (error) {
    console.error('❌ Data initialization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize data',
      error: error.message
    });
  }
}

