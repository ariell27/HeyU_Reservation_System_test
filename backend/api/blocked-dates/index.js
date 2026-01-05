// Vercel serverless function - Blocked Dates API
import {
  readBlockedDates,
  saveBlockedDates,
  validateBlockedDate
} from '../../utils/blockedDatesUtils.js';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/blocked-dates - Get all blocked dates
    if (req.method === 'GET') {
      const blockedDates = await readBlockedDates();
      return res.json({
        success: true,
        count: blockedDates.length,
        blockedDates: blockedDates
      });
    }

    // POST /api/blocked-dates - Create or update blocked date
    if (req.method === 'POST') {
      const blockedDateData = req.body;

      // Validate data
      const validation = validateBlockedDate(blockedDateData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Data validation failed',
          errors: validation.errors
        });
      }

      const blockedDates = await readBlockedDates();
      const existingIndex = blockedDates.findIndex(b => b.date === blockedDateData.date);

      if (existingIndex !== -1) {
        blockedDates[existingIndex] = {
          date: blockedDateData.date,
          times: blockedDateData.times || []
        };
      } else {
        blockedDates.push({
          date: blockedDateData.date,
          times: blockedDateData.times || []
        });
      }

      await saveBlockedDates(blockedDates);
      const savedDate = existingIndex !== -1 ? blockedDates[existingIndex] : blockedDates[blockedDates.length - 1];

      return res.json({
        success: true,
        message: 'Blocked date saved successfully',
        blockedDate: savedDate
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    console.error('Blocked dates API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

