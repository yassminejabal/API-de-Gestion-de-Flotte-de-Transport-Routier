const {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} = require('../../src/utils/AppError');
const errorHandler = require('../../src/middlewares/error.middleware');
const { protect, restrictToAdmin } = require('../../src/middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/userModel');

jest.mock('jsonwebtoken');
jest.mock('../../src/models/userModel');

describe('Suite de tests unitaires - AppError & Middlewares', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Classes AppError', () => {
    it('devrait correctement instancier AppError avec le bon code et statut', () => {
      const err400 = new AppError('Erreur client', 400);
      expect(err400.statusCode).toBe(400);
      expect(err400.status).toBe('fail');
      expect(err400.isOperationel).toBe(true);

      const err500 = new AppError('Erreur serveur', 500);
      expect(err500.statusCode).toBe(500);
      expect(err500.status).toBe('error');
    });

    it('devrait instancier BadRequestError avec code 400', () => {
      const err = new BadRequestError('Champs invalides');
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Champs invalides');
      expect(err.status).toBe('fail');
    });

    it('devrait instancier UnauthorizedError avec code 401', () => {
      const err = new UnauthorizedError();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Accès non autorisé');
    });

    it('devrait instancier NotFoundError avec code 404', () => {
      const err = new NotFoundError('Élément non trouvé');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Élément non trouvé');
    });

    it('devrait instancier ConflictError avec code 409', () => {
      const err = new ConflictError('Conflit détecté');
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe('Conflit détecté');
    });

    it('devrait instancier InternalServerError avec code 500', () => {
      const err = new InternalServerError();
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Erreur interne du serveur');
    });
  });

  describe('error.middleware - errorHandler', () => {
    it('devrait renvoyer le code d\'erreur et le message personnalisés', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      const err = { statusCode: 404, message: 'Ressource introuvable' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Ressource introuvable',
      });
    });

    it('devrait utiliser les valeurs par défaut (500, "Erreur serveur") si non spécifiées', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      const err = {};

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erreur serveur',
      });
    });
  });

  describe('authMiddleware - restrictToAdmin', () => {
    it('devrait appeler next() si l\'utilisateur a le rôle ADMIN', () => {
      const req = { user: { role: 'ADMIN' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      restrictToAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('devrait renvoyer 403 si l\'utilisateur n\'a pas le rôle ADMIN', () => {
      const req = { user: { role: 'CHAUFFEUR' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      restrictToAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'fail' })
      );
    });

    it('devrait renvoyer 403 si aucun utilisateur n\'est attaché à la requête', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      restrictToAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('authMiddleware - protect', () => {
    it('devrait renvoyer 401 si aucun token d\'autorisation n\'est fourni', async () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Accès refusé. Aucun token fourni.' })
      );
    });

    it('devrait renvoyer 401 si le token est invalide ou expiré', async () => {
      const req = { headers: { authorization: 'Bearer token_invalide' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Token invalide ou expiré.' })
      );
    });

    it('devrait renvoyer 401 si l\'utilisateur lié au token n\'existe plus', async () => {
      const req = { headers: { authorization: 'Bearer token_valide' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      jwt.verify.mockReturnValue({ id: 'u_supprime' });
      User.findById.mockResolvedValue(null);

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "L'utilisateur associe a ce token n'existe plus" })
      );
    });

    it('devrait attacher l\'utilisateur à req.user et appeler next() si le token est valide', async () => {
      const req = { headers: { authorization: 'Bearer valid_token' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const mockUser = { _id: 'u1', role: 'ADMIN', email: 'admin@example.com' };
      jwt.verify.mockReturnValue({ id: 'u1' });
      User.findById.mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(req.user).toBe(mockUser);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
