const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/AuthController');
const { protect, restrictToAdmin } = require("../../middlewares/authMiddleware");
router.post('/register', AuthController.register);
router.post('/login' ,AuthController.login);
router.get('/Admin',protect,restrictToAdmin, (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  })});

module.exports = router;