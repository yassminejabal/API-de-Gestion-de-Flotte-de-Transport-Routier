// src/controllers/AuthController.js
const authService = require('../services/AuthService');

class AuthController {
   async register(req, res, next){
    try {
      const result = await authService.register(req.body);
      return res.status(201).json({
        status: 'success',
        message: 'Utilisateur créé avec succès',
        token: result.token,
        data: {
          user: result.user
        }
      });
    } catch (error) {
      next(error);
    }
  };

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return res.status(200).json({
        status: 'success',
        message: 'Connexion réussie',
        token: result.token,
        data: {
          user: result.user
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AuthController();