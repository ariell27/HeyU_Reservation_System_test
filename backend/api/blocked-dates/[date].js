// Vercel serverless function - Delete blocked date by date
import {
  readBlockedDates,
  saveBlockedDates
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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { date } = req.query;
    const blockedDates = await readBlockedDates();

    const filteredDates = blockedDates.filter(b => b.date !== date);

    if (filteredDates.length === blockedDates.length) {
      return res.status(404).json({
        success: false,
        message: 'Blocked date not found'
      });
    }

    await saveBlockedDates(filteredDates);

    return res.json({
      success: true,
      message: 'Blocked date deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete blocked date:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, unable to delete blocked date',
      error: error.message
    });
  }
}

