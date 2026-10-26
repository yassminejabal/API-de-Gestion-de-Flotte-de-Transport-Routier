const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('connect', () => {
  console.log('[REDIS] Connecté avec succès au serveur');
});

redisClient.on('error', (err) => {
  console.error('[REDIS] Erreur de connexion :', err.message);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('[REDIS] Échec de la connexion initiale :', err.message);
  }
})();

module.exports = redisClient;