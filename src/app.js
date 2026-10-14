const express = require("express");
const app = express();

app.use(express.json());

const authRoutes = require("../src/routes/auth/routes");
const camionRoutes = require("../src/routes/camionRoutes");
const remorqueRoutes = require("../src/routes/remorqueRoutes");
const pneuRoutes = require("../src/routes/pneuRoutes");
const trajetRoutes = require("../src/routes/trajetRoutes");
const chauffeurRoutes = require("../src/routes/chauffeurRoutes");
const errorHandler = require("../src/middlewares/error.middleware");
const maintenanceRoutes = require('./routes/maintenanceRoutes.js');


app.use("/api/auth", authRoutes);
app.use("/api/remorques", remorqueRoutes);
app.use("/api/camions", camionRoutes);
app.use("/api/pneus", pneuRoutes);
app.use("/api/trajets", trajetRoutes);
app.use("/api/chauffeurs", chauffeurRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use(errorHandler);  


module.exports = app;
