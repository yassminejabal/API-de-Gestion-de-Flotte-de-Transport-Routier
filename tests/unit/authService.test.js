const authService = require('../../src/services/AuthService');
const User = require('../../src/models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../src/models/userModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Suite de tests unitaires - AuthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('genererToken', () => {
    it('devrait générer un token JWT valide avec l\'ID utilisateur', () => {
      jwt.sign.mockReturnValue('mocked_jwt_token');

      const token = authService.genererToken('user123');

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123' },
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(token).toBe('mocked_jwt_token');
    });
  });

  describe('register', () => {
    it('devrait lever une erreur 400 si des champs obligatoires sont manquants', async () => {
      await expect(authService.register({ nom: 'Test' })).rejects.toMatchObject({
        message: 'Tous les champs sont obligatoires',
        statusCode: 400,
      });

      await expect(authService.register({ email: 'test@example.com', password: 'pass' })).rejects.toMatchObject({
        message: 'Tous les champs sont obligatoires',
        statusCode: 400,
      });
    });

    it('devrait lever une erreur 400 si l\'email existe déjà', async () => {
      User.findOne.mockResolvedValueOnce({ _id: 'existantId', email: 'deja@example.com' });

      await expect(
        authService.register({
          nom: 'Dupont',
          email: 'deja@example.com',
          password: 'SecretPassword123!',
        })
      ).rejects.toMatchObject({
        message: 'Cet email est deja utilise',
        statusCode: 400,
      });
    });

    it('devrait créer un nouvel utilisateur et retourner les informations sans mot de passe ainsi qu\'un token', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const mockSavedUser = {
        _id: 'newUser123',
        nom: 'Dupont',
        email: 'dupont@example.com',
        role: 'CHAUFFEUR',
        password: 'hashedPassword',
        toObject: jest.fn().mockReturnValue({
          _id: 'newUser123',
          nom: 'Dupont',
          email: 'dupont@example.com',
          role: 'CHAUFFEUR',
          password: 'hashedPassword',
        }),
      };

      User.create.mockResolvedValueOnce(mockSavedUser);
      jwt.sign.mockReturnValue('generated_token');

      const resultat = await authService.register({
        nom: 'Dupont',
        email: 'dupont@example.com',
        password: 'SecretPassword123!',
        role: 'CHAUFFEUR',
      });

      expect(User.create).toHaveBeenCalledWith({
        nom: 'Dupont',
        email: 'dupont@example.com',
        password: 'SecretPassword123!',
        role: 'CHAUFFEUR',
      });
      expect(resultat.token).toBe('generated_token');
      expect(resultat.user.password).toBeUndefined();
      expect(resultat.user.email).toBe('dupont@example.com');
    });
  });

  describe('login', () => {
    it('devrait lever une erreur 400 si email ou mot de passe est manquant', async () => {
      await expect(authService.login('', 'pass')).rejects.toMatchObject({
        message: 'Email et mot de passe sont obligatoires',
        statusCode: 400,
      });

      await expect(authService.login('test@example.com', '')).rejects.toMatchObject({
        message: 'Email et mot de passe sont obligatoires',
        statusCode: 400,
      });
    });

    it('devrait lever une erreur 401 si l\'utilisateur n\'existe pas', async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValue(null),
      };
      User.findOne.mockReturnValue(mockQuery);

      await expect(authService.login('inconnu@example.com', 'pass123')).rejects.toMatchObject({
        message: 'Email ou mot de passe incorrect',
        statusCode: 401,
      });
    });

    it('devrait lever une erreur 401 si le mot de passe ne correspond pas', async () => {
      const mockUser = {
        _id: 'u1',
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      User.findOne.mockReturnValue(mockQuery);
      bcrypt.compare.mockResolvedValueOnce(false);

      await expect(authService.login('test@example.com', 'mauvaisPass')).rejects.toMatchObject({
        message: 'Email ou mot de passe incorrect',
        statusCode: 401,
      });
    });

    it('devrait authentifier l\'utilisateur et renvoyer le profil et le token', async () => {
      const mockUser = {
        _id: 'u1',
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      User.findOne.mockReturnValue(mockQuery);
      bcrypt.compare.mockResolvedValueOnce(true);
      jwt.sign.mockReturnValue('valid_token_xyz');

      const resultat = await authService.login('test@example.com', 'bonPass');

      expect(bcrypt.compare).toHaveBeenCalledWith('bonPass', 'hashedPassword');
      expect(resultat.token).toBe('valid_token_xyz');
      expect(resultat.user.password).toBeUndefined();
      expect(resultat.user._id).toBe('u1');
    });

    it('devrait refuser l\'authentification d\'un compte suspendu sans créer de token', async () => {
      const mockUser = {
        _id: 'u2',
        email: 'suspendu@example.com',
        password: 'hashedPassword',
        isSuspended: true,
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      bcrypt.compare.mockResolvedValueOnce(true);

      await expect(authService.login('suspendu@example.com', 'bonPass')).rejects.toMatchObject({
        message: 'Ce compte est suspendu',
        statusCode: 403,
      });
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
});
