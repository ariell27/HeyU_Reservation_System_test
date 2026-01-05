// Vercel serverless function - Delete specific time slot block
import {
  readBlockedDates,
  saveBlockedDates
} from '../../../../utils/blockedDatesUtils.js';
import { initRedisClient } from '../../../../utils/redis.js';

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
    const { date, time } = req.query;
    const blockedDates = await readBlockedDates();

    const blockedDate = blockedDates.find(b => b.date === date);

    if (!blockedDate) {
      return res.status(404).json({
        success: false,
        message: 'Blocked date not found'
      });
    }

    const filteredTimes = blockedDate.times.filter(t => t !== time);

    // If no time slots left, delete entire date record
    if (filteredTimes.length === 0) {
      const filteredDates = blockedDates.filter(b => b.date !== date);
      await saveBlockedDates(filteredDates);
    } else {
      blockedDate.times = filteredTimes;
      await saveBlockedDates(blockedDates);
    }

    return res.json({
      success: true,
      message: 'Time slot block deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete time slot block:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, unable to delete time slot block',
      error: error.message
    });
  }
}

