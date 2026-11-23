const express = require("express");
const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const swaggerUi = require("swagger-ui-express");
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());
app.use(express.json());
const openApiDocument = YAML.parse(
  fs.readFileSync(path.join(__dirname, "..", "openapi.yaml"), "utf8"),
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

const { authLimiter } = require("./middlewares/rateLimiter");

const authRoutes = require("../src/routes/auth/routes");
const camionRoutes = require("../src/routes/camionRoutes");
const remorqueRoutes = require("../src/routes/remorqueRoutes");
const pneuRoutes = require("../src/routes/pneuRoutes");
const trajetRoutes = require("../src/routes/trajetRoutes");
const chauffeurRoutes = require("../src/routes/chauffeurRoutes");
const errorHandler = require("../src/middlewares/error.middleware");
const maintenanceRoutes = require('./routes/maintenanceRoutes.js');
const tripRoutesV2 = require("./routes/tripRoutesV2");
const analyticsRoutes = require("./routes/analyticsRoutes");
app.use("/api/auth", authLimiter, authRoutes);

app.use("/api/remorques", remorqueRoutes);
app.use("/api/camions", camionRoutes);
app.use("/api/pneus", pneuRoutes);
app.use("/api/trajets", trajetRoutes);
app.use("/api/chauffeurs", chauffeurRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use("/api/v2/analytics", analyticsRoutes);

app.use("/api/v2", (req, res, next) => {
  res.setHeader("X-API-Version", "2.0.0");
  res.setHeader("X-API-Deprecated", "false");
  next();
});

app.use("/api/v2/trips", tripRoutesV2);

app.use(errorHandler);

module.exports = app; 