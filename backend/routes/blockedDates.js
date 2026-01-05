import express from 'express';
import {
  readBlockedDates,
  saveBlockedDates,
  validateBlockedDate
} from '../utils/blockedDatesUtils.js';

const router = express.Router();

// GET /api/blocked-dates - Get all blocked dates
router.get('/', async (req, res) => {
  try {
    const blockedDates = await readBlockedDates();
    res.json({
      success: true,
      count: blockedDates.length,
      blockedDates: blockedDates
    });
  } catch (error) {
    console.error('Failed to get blocked dates list:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to get blocked dates list',
      error: error.message
    });
  }
});

// POST /api/blocked-dates - Create or update blocked date
router.post('/', async (req, res) => {
  try {
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
    
    // Check if date already exists
    const existingIndex = blockedDates.findIndex(b => b.date === blockedDateData.date);
    
    if (existingIndex !== -1) {
      // Update existing record
      blockedDates[existingIndex] = {
        date: blockedDateData.date,
        times: blockedDateData.times || []
      };
    } else {
      // Add new record
      blockedDates.push({
        date: blockedDateData.date,
        times: blockedDateData.times || []
      });
    }

    await saveBlockedDates(blockedDates);

    res.json({
      success: true,
      message: 'Blocked date saved successfully',
      blockedDate: existingIndex !== -1 ? blockedDates[existingIndex] : blockedDates[blockedDates.length - 1]
    });
  } catch (error) {
    console.error('Failed to save blocked date:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to save blocked date',
      error: error.message
    });
  }
});

// DELETE /api/blocked-dates/:date - Delete entire blocked date
router.delete('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const blockedDates = await readBlockedDates();
    
    const filteredDates = blockedDates.filter(b => b.date !== date);
    
    if (filteredDates.length === blockedDates.length) {
      return res.status(404).json({
        success: false,
        message: 'Blocked date not found'
      });
    }

    await saveBlockedDates(filteredDates);

    res.json({
      success: true,
      message: 'Blocked date deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete blocked date:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to delete blocked date',
      error: error.message
    });
  }
});

// DELETE /api/blocked-dates/:date/times/:time - Delete specific time slot block
router.delete('/:date/times/:time', async (req, res) => {
  try {
    const { date, time } = req.params;
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

    res.json({
      success: true,
      message: 'Time slot block deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete time slot block:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to delete time slot block',
      error: error.message
    });
  }
});

export default router;
