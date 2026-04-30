const redis = require('redis');
require('dotenv').config();

let client = null;
let isConnected = false;

const connectRedis = async () => {
  // Не создаем клиент, если Redis не настроен
  if (!process.env.REDIS_HOST) {
    console.log('⚠️  Redis not configured, skipping...');
    return;
  }

  try {
    client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('error', (err) => {
      console.error('⚠️  Redis Client Error:', err.message);
      isConnected = false;
    });

    client.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
    });

    await client.connect();
  } catch (error) {
    console.log('⚠️  Redis connection failed, continuing without Redis...');
    client = null;
  }
};

module.exports = {
  client,
  connectRedis,
  isConnected: () => isConnected,
};
