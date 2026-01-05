import express from 'express';
import {
  readServices,
  saveServices,
  getServiceById,
  getServicesByCategory
} from '../utils/serviceUtils.js';

const router = express.Router();

// GET /api/services - Get all services
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let services = await readServices();

    // Filter by category
    if (category) {
      services = await getServicesByCategory(category);
    }

    res.json({
      success: true,
      count: services.length,
      services: services
    });
  } catch (error) {
    console.error('Failed to get services list:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to get services list',
      error: error.message
    });
  }
});

// GET /api/services/:serviceId - Get single service by ID
router.get('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await getServiceById(parseInt(serviceId));

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      service: service
    });
  } catch (error) {
    console.error('Failed to get service details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to get service details',
      error: error.message
    });
  }
});

// POST /api/services - Create or update service (admin function)
router.post('/', async (req, res) => {
  try {
    const serviceData = req.body;
    const services = await readServices();

    // If ID is provided, update existing service
    if (serviceData.id) {
      const index = services.findIndex(s => s.id === serviceData.id);
      if (index !== -1) {
        services[index] = { ...services[index], ...serviceData };
        await saveServices(services);
        return res.json({
          success: true,
          message: 'Service updated successfully',
          service: services[index]
        });
      }
    }

    // Create new service (auto-generate ID)
    const newId = services.length > 0 
      ? Math.max(...services.map(s => s.id)) + 1 
      : 1;
    
    const newService = {
      id: newId,
      ...serviceData
    };

    services.push(newService);
    await saveServices(services);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service: newService
    });
  } catch (error) {
    console.error('Failed to create/update service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to create/update service',
      error: error.message
    });
  }
});

export default router;
