const { createClient } = require('redis');

let redisClient;

const connectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis: Connected');
    });

    redisClient.on('disconnect', () => {
      console.log('❌ Redis: Disconnected');
    });

    redisClient.on('ready', () => {
      console.log('🔄 Redis: Ready');
    });

    await redisClient.connect();
    console.log('🎯 Redis: Successfully connected');

    return redisClient;
  } catch (error) {
    console.error('❌ Redis Connection Error:', error);
    throw error;
  }
};

const getRedisClient = () => {
  return redisClient;
};

const disconnectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.disconnect();
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  disconnectRedis,
};