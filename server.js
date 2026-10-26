const dotenv = require('dotenv');
const mongoose = require("mongoose");
const app = require("./src/app");
const { authLimiter } = require('./src/middlewares/rateLimiter');
// pour les vairaible de .env
dotenv.config();
require("./src/config/Database");


const PORT = process.env.PORT || 5000;


app.get('/', (req, res) => {
  res.send('Server et MongoDB');
});


app.listen(PORT,()=>{
    console.log(`serveur et ecoute dans porte ${PORT}`);
});
// xahina 6abc67f22babf235551afc6b


// Appliquer ghir 3la les routes dyal auth
app.use('/api/v1/auth', authLimiter);
app.use('/api/v2/auth', authLimiter);
// pnu 6abdb83c7b834e396ec282ea