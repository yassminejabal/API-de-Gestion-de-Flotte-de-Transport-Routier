const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient, connectRedis } = require('../config/redis');

// Rate limiter l-Auth: 10 requêtes / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: async (...args) => {
      await connectRedis();
      return redisClient.sendCommand(args);
    },
    prefix: 'rl:auth:'
  }),
  message: {
    status: 'fail',
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  }
});

module.exports = { authLimiter };
