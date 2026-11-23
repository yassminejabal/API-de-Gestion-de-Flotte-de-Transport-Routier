const chauffeurService = require('../../src/services/ChauffeurService');
const User = require('../../src/models/userModel');
const sendEmail = require('../../src/utils/sendEmail');
const { ConflictError, NotFoundError } = require('../../src/utils/AppError');

jest.mock('../../src/models/userModel');
jest.mock('../../src/utils/sendEmail');

describe('Suite de tests unitaires - ChauffeurService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('creerChauffeur', () => {
    it('devrait lever un ConflictError si un utilisateur avec cet email existe déjà', async () => {
      User.findOne.mockResolvedValueOnce({ _id: 'u1', email: 'chauffeur@example.com' });

      await expect(
        chauffeurService.creerChauffeur({
          nom: 'Alami',
          prenom: 'Karim',
          email: 'chauffeur@example.com',
          telephone: '0612345678',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('devrait créer un chauffeur avec mot de passe temporaire et envoyer un email', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const mockChauffeurCree = {
        _id: 'ch1',
        nom: 'Alami',
        prenom: 'Karim',
        email: 'karim@example.com',
        telephone: '0612345678',
        role: 'CHAUFFEUR',
        isSuspended: false,
        estArchive: false,
        password: 'temporaryPassword123!',
      };

      User.create.mockResolvedValueOnce(mockChauffeurCree);
      sendEmail.mockResolvedValueOnce(true);

      const resultat = await chauffeurService.creerChauffeur({
        nom: 'Alami',
        prenom: 'Karim',
        email: 'karim@example.com',
        telephone: '0612345678',
      });

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nom: 'Alami',
          prenom: 'Karim',
          email: 'karim@example.com',
          role: 'CHAUFFEUR',
          password: expect.stringMatching(/A1!$/),
        })
      );
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'karim@example.com',
          subject: expect.stringContaining('identifiants'),
        })
      );
      expect(resultat.password).toBeUndefined();
      expect(resultat.nom).toBe('Alami');
    });

    it('devrait créer le chauffeur même si l\'envoi de l\'email échoue', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const mockChauffeurCree = {
        _id: 'ch1',
        nom: 'Alami',
        prenom: 'Karim',
        email: 'karim@example.com',
        telephone: '0612345678',
        role: 'CHAUFFEUR',
        password: 'temporaryPassword123!',
      };

      User.create.mockResolvedValueOnce(mockChauffeurCree);
      sendEmail.mockRejectedValueOnce(new Error('SMTP Error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const resultat = await chauffeurService.creerChauffeur({
        nom: 'Alami',
        prenom: 'Karim',
        email: 'karim@example.com',
        telephone: '0612345678',
      });

      expect(resultat.password).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('recupererTousLesChauffeurs', () => {
    it('devrait retourner tous les chauffeurs actifs sans leur mot de passe', async () => {
      const mockChauffeurs = [
        { _id: 'ch1', nom: 'Alami', role: 'CHAUFFEUR', actif: true },
        { _id: 'ch2', nom: 'Bennani', role: 'CHAUFFEUR', actif: true },
      ];

      const mockQuery = {
        select: jest.fn().mockResolvedValueOnce(mockChauffeurs),
      };
      User.find.mockReturnValue(mockQuery);

      const res = await chauffeurService.recupererTousLesChauffeurs();

      expect(User.find).toHaveBeenCalledWith({ role: 'CHAUFFEUR', actif: true });
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(res).toEqual(mockChauffeurs);
    });
  });

  describe('basculerSuspensionChauffeur', () => {
    it('devrait lever un NotFoundError si le chauffeur n\'est pas trouvé', async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValueOnce(null),
      };
      User.findOne.mockReturnValue(mockQuery);

      await expect(
        chauffeurService.basculerSuspensionChauffeur('chInexistant')
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait inverser l\'état de suspension d\'un chauffeur', async () => {
      const mockChauffeur = {
        _id: 'ch1',
        nom: 'Alami',
        isSuspended: false,
        password: 'secret',
        save: jest.fn().mockResolvedValue(true),
      };

      const mockQuery = {
        select: jest.fn().mockResolvedValueOnce(mockChauffeur),
      };
      User.findOne.mockReturnValue(mockQuery);

      const res = await chauffeurService.basculerSuspensionChauffeur('ch1');

      expect(mockChauffeur.isSuspended).toBe(true);
      expect(mockChauffeur.save).toHaveBeenCalled();
      expect(res.password).toBeUndefined();
    });
  });

  describe('archiverChauffeur', () => {
    it('devrait lever un NotFoundError si le chauffeur n\'est pas trouvé pour archivage', async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValueOnce(null),
      };
      User.findOneAndUpdate.mockReturnValue(mockQuery);

      await expect(
        chauffeurService.archiverChauffeur('chInexistant')
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait désactiver le chauffeur avec succès', async () => {
      const mockChauffeurArchive = {
        _id: 'ch1',
        nom: 'Alami',
        actif: false,
      };

      const mockQuery = {
        select: jest.fn().mockResolvedValueOnce(mockChauffeurArchive),
      };
      User.findOneAndUpdate.mockReturnValue(mockQuery);

      const res = await chauffeurService.archiverChauffeur('ch1');

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'ch1', role: 'CHAUFFEUR', actif: true },
        { actif: false },
        { new: true }
      );
      expect(res).toEqual(mockChauffeurArchive);
    });
  });

  describe('modifierChauffeur', () => {
    it('devrait lever un NotFoundError si le chauffeur à modifier n\'est pas trouvé', async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValueOnce(null),
      };
      User.findOneAndUpdate.mockReturnValue(mockQuery);

      await expect(
        chauffeurService.modifierChauffeur('chInexistant', { telephone: '0699999999' })
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait mettre à jour les données du chauffeur et le retourner', async () => {
      const mockChauffeurModifie = {
        _id: 'ch1',
        nom: 'Alami',
        telephone: '0699999999',
      };

      const mockQuery = {
        select: jest.fn().mockResolvedValueOnce(mockChauffeurModifie),
      };
      User.findOneAndUpdate.mockReturnValue(mockQuery);

      const res = await chauffeurService.modifierChauffeur('ch1', { telephone: '0699999999' });

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'ch1', role: 'CHAUFFEUR', actif: true },
        { telephone: '0699999999' }
      );
      expect(res).toEqual(mockChauffeurModifie);
    });
  });
});
