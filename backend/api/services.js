// Vercel serverless function - Services API
import {
  readServices,
  saveServices,
  getServiceById,
  getServicesByCategory
} from '../utils/serviceUtils.js';
import { initRedisClient } from '../utils/redis.js';

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
    // GET /api/services - Get all services
    if (req.method === 'GET') {
      const { category } = req.query;
      let services = await readServices();

      if (category) {
        services = await getServicesByCategory(category);
      }

      return res.json({
        success: true,
        count: services.length,
        services: services
      });
    }

    // POST /api/services - Create or update service
    if (req.method === 'POST') {
      const serviceData = req.body;

      if (!serviceData.nameCn || !serviceData.nameEn) {
        return res.status(400).json({
          success: false,
          message: 'Service name (both Chinese and English) is required'
        });
      }

      const services = await readServices();
      const existingIndex = services.findIndex(s => s.id === serviceData.id);

      if (existingIndex >= 0) {
        // Update existing service
        services[existingIndex] = { ...services[existingIndex], ...serviceData };
      } else {
        // Create new service
        const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
        services.push({
          id: newId,
          ...serviceData
        });
      }

      await saveServices(services);
      const savedService = services.find(s => s.id === (serviceData.id || services[services.length - 1].id));

      return res.json({
        success: true,
        message: existingIndex >= 0 ? 'Service updated successfully' : 'Service created successfully',
        service: savedService
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  } catch (error) {
    console.error('Services API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

