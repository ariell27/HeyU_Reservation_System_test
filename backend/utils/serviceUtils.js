import { getRedisClientAsync, REDIS_KEYS } from './redis.js';

// Read all services
export async function readServices() {
  try {
    const client = await getRedisClientAsync();
    const data = await client.get(REDIS_KEYS.SERVICES);
    
    if (data === null) {
      // If no data in Redis, return empty array
      return [];
    }
    
    // Parse JSON string
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    
    // If stored in old format (object with services field), extract services array
    if (typeof parsed === 'object' && parsed.services) {
      return parsed.services;
    }
    
    // If directly stored as array, return directly
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to read service data:', error);
    return [];
  }
}

// Save all services
export async function saveServices(services) {
  try {
    const client = await getRedisClientAsync();
    const data = {
      services: services,
      lastUpdated: new Date().toISOString()
    };
    // Vercel KV can handle objects directly, but JSON.stringify is safer
    await client.set(REDIS_KEYS.SERVICES, JSON.stringify(data));
    console.log(`✅ Saved ${services.length} services to Redis`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save service data:', error);
    throw error;
  }
}

// Get service by ID
export async function getServiceById(serviceId) {
  const services = await readServices();
  return services.find(service => service.id === serviceId);
}

// Get services by category
export async function getServicesByCategory(category) {
  const services = await readServices();
  return services.filter(service => service.category === category);
}
