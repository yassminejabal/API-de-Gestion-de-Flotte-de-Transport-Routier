const dotenv = require('dotenv');

dotenv.config();

const mongoose = require('mongoose');
const { redisClient, connectRedis } = require('./src/config/redis');
const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectRedis();
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fleet_db');

  const app = require('./src/app');
  const { authLimiter } = require('./src/middlewares/rateLimiter');

  app.get('/', (req, res) => {
    res.send('Server et MongoDB');
  });

  app.use('/api/v1/auth', authLimiter);
  app.use('/api/v2/auth', authLimiter);

  const server = app.listen(PORT, () => {
    console.log(`Serveur et MongoDB actifs sur le port ${PORT}`);
  });

  return server;
}

startServer().catch(async (error) => {
  console.error('Impossible de demarrer le serveur :', error.message);

  if (redisClient.isOpen) {
    await redisClient.quit();
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exitCode = 1;
});
