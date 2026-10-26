const express = require('express');
const router = express.Router();
const trajetController = require('../controllers/TrajetController');
// Vérifie le chemin de ton middleware d'authentification
const {protect} = require('../middlewares/authMiddleware');
// Endpoint officiel selon le cahier des charges
router.get('/:id/mission-order-url', protect, (req, res, next) => {
  trajetController.getMissionOrderPresignedUrl(req, res, next);
});
module.exports = router;