const express = require('express');
const maintenanceController = require('../controllers/MaintenanceController.js');
const { protect } = require('../middlewares/authMiddleware.js');

const router = express.Router();

router.get('/alertes', protect, (req, res, next) =>
  maintenanceController.getAlertes(req, res, next)
);

module.exports = router;