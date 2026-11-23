const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
});

let connectionPromise = null;

redisClient.on('connect', () => {
  console.log('[REDIS] Connecte avec succes au serveur');
});

redisClient.on('error', (error) => {
  console.error('[REDIS] Erreur de connexion :', error.message);
});

async function connectRedis() {
  if (redisClient.isReady) {
    return redisClient;
  }

  if (!connectionPromise) {
    connectionPromise = redisClient.connect().finally(() => {
      connectionPromise = null;
    });
  }

  await connectionPromise;
  return redisClient;
}

module.exports = {
  redisClient,
  connectRedis,
};
