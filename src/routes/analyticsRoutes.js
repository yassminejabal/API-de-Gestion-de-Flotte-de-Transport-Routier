
const express = require("express");
const router = express.Router();

const AnalyticsController = require("../controllers/analyticsController");

router.get(
  "/tires/health-matrix",
  AnalyticsController.getTiresHealthMatrix
);

module.exports = router;
