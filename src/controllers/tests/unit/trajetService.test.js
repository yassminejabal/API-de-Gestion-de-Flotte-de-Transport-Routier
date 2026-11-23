const trajetService = require('../../../services/TrajetService');
const Trajet = require('../../../models/TrajetModel');
const Camion = require('../../../models/CamionModel');
const Pneu = require('../../../models/pneuModel');
const Remorque = require('../../../models/remorqueModel');
const User = require('../../../models/userModel');
const {
  NotFoundError,
  ConflictError,
  BadRequestError,
} = require('../../../utils/AppError');

jest.mock('../../../models/TrajetModel');
jest.mock('../../../models/CamionModel');
jest.mock('../../../models/pneuModel');
jest.mock('../../../models/remorqueModel');
jest.mock('../../../models/userModel');

describe('Suite de tests unitaires - TrajetService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifierDisponibilite', () => {
    it('devrait lever un ConflictError si le camion est déjà assigné à un trajet actif', async () => {
      Trajet.findOne.mockResolvedValueOnce({ _id: 'trajetActifId' });
      await expect(
        trajetService.verifierDisponibilite('camion1', 'remorque1', 'chauffeur1')
      ).rejects.toThrow(ConflictError);
    });

    it('devrait lever un ConflictError si la remorque est déjà assignée à un trajet actif', async () => {
      Trajet.findOne.mockResolvedValueOnce(null); // camion actif check
      Trajet.findOne.mockResolvedValueOnce({ _id: 'trajetActifRemorqueId' }); // remorque active check

      await expect(
        trajetService.verifierDisponibilite('camion1', 'remorque1', 'chauffeur1')
      ).rejects.toThrow(ConflictError);
    });

    it('devrait lever un NotFoundError si le camion est introuvable', async () => {
      Trajet.findOne.mockResolvedValueOnce(null); // camion actif
      Trajet.findOne.mockResolvedValueOnce(null); // remorque active
      Camion.findOne.mockResolvedValueOnce(null); // camion introuvable

      await expect(
        trajetService.verifierDisponibilite('camion1', 'remorque1', 'chauffeur1')
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait lever un ConflictError si le camion a une alerte de maintenance active', async () => {
      Trajet.findOne.mockResolvedValueOnce(null);
      Trajet.findOne.mockResolvedValueOnce(null);
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1', alerteMaintenance: true, statut: 'DISPONIBLE' });

      await expect(
        trajetService.verifierDisponibilite('c1', 'r1', 'ch1')
      ).rejects.toThrow(ConflictError);
    });

    it('devrait lever un ConflictError si le camion n\'est pas au statut DISPONIBLE', async () => {
      Trajet.findOne.mockResolvedValueOnce(null);
      Trajet.findOne.mockResolvedValueOnce(null);
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1', alerteMaintenance: false, statut: 'EN_MAINTENANCE' });

      await expect(
        trajetService.verifierDisponibilite('c1', 'r1', 'ch1')
      ).rejects.toThrow(ConflictError);
    });

    it('devrait lever un NotFoundError si la remorque est introuvable', async () => {
      Trajet.findOne.mockResolvedValueOnce(null);
      Trajet.findOne.mockResolvedValueOnce(null);
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1', alerteMaintenance: false, statut: 'DISPONIBLE' });
      Remorque.findOne.mockResolvedValueOnce(null);

      await expect(
        trajetService.verifierDisponibilite('c1', 'r1', 'ch1')
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait lever un ConflictError si la remorque a une alerte de maintenance', async () => {
      Trajet.findOne.mockResolvedValueOnce(null);
      Trajet.findOne.mockResolvedValueOnce(null);
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1', alerteMaintenance: false, statut: 'DISPONIBLE' });
      Remorque.findOne.mockResolvedValueOnce({ _id: 'r1', alerteMaintenance: true, statut: 'DISPONIBLE' });

      await expect(
        trajetService.verifierDisponibilite('c1', 'r1', 'ch1')
      ).rejects.toThrow(ConflictError);
    });

    it('devrait lever un ConflictError si la remorque n\'est pas DISPONIBLE', async () => {
      Trajet.findOne.mockResolvedValueOnce(null);
      Trajet.findOne.mockResolvedValueOnce(null);
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1', alerteMaintenance: false, statut: 'DISPONIBLE' });
      Remorque.findOne.mockResolvedValueOnce({ _id: 'r1', alerteMaintenance: false, statut: 'EN_TRAJET' });

      await expect(
        trajetService.verifierDisponibilite('c1', 'r1', 'ch1')
      ).rejects.toThrow(ConflictError);
    });

    it('devrait lever un NotFoundError si le chauffeur est introuvable', async () => {
      Trajet.findOne.mockResolvedValueOnce(null);
      Trajet.findOne.mockResolvedValueOnce(null);
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1', alerteMaintenance: false, statut: 'DISPONIBLE' });
      Remorque.findOne.mockResolvedValueOnce({ _id: 'r1', alerteMaintenance: false, statut: 'DISPONIBLE' });
      User.findOne.mockResolvedValueOnce(null);

      await expect(
        trajetService.verifierDisponibilite('c1', 'r1', 'ch1')
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait lever un BadRequestError si le rôle de l\'utilisateur n\'est pas CHAUFFEUR', async () => {
      Trajet.findOne.mockResolvedValueOnce(null);
      Trajet.findOne.mockResolvedValueOnce(null);
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1', alerteMaintenance: false, statut: 'DISPONIBLE' });
      Remorque.findOne.mockResolvedValueOnce({ _id: 'r1', alerteMaintenance: false, statut: 'DISPONIBLE' });
      User.findOne.mockResolvedValueOnce({ _id: 'ch1', role: 'ADMIN', actif: true });

      await expect(
        trajetService.verifierDisponibilite('c1', 'r1', 'ch1')
      ).rejects.toThrow(BadRequestError);
    });

    it('devrait lever un ConflictError si le chauffeur est suspendu', async () => {
      Trajet.findOne.mockResolvedValueOnce(null);
      Trajet.findOne.mockResolvedValueOnce(null);
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1', alerteMaintenance: false, statut: 'DISPONIBLE' });
      Remorque.findOne.mockResolvedValueOnce({ _id: 'r1', alerteMaintenance: false, statut: 'DISPONIBLE' });
      User.findOne.mockResolvedValueOnce({
        _id: 'ch1',
        role: 'CHAUFFEUR',
        isSuspended: true,
      });

      await expect(
        trajetService.verifierDisponibilite('c1', 'r1', 'ch1')
      ).rejects.toThrow(ConflictError);
    });

    it('devrait lever un ConflictError si le chauffeur a déjà une mission active ou planifiée', async () => {
      Trajet.findOne.mockResolvedValueOnce(null);
      Trajet.findOne.mockResolvedValueOnce(null);
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1', alerteMaintenance: false, statut: 'DISPONIBLE' });
      Remorque.findOne.mockResolvedValueOnce({ _id: 'r1', alerteMaintenance: false, statut: 'DISPONIBLE' });
      User.findOne.mockResolvedValueOnce({ _id: 'ch1', role: 'CHAUFFEUR', isSuspended: false });
      Trajet.findOne.mockResolvedValueOnce({ _id: 'missionActiveChauffeur' });

      await expect(
        trajetService.verifierDisponibilite('c1', 'r1', 'ch1')
      ).rejects.toThrow(ConflictError);
    });

    it('devrait retourner les entités camion, remorque et chauffeur lorsque tout est disponible', async () => {
      Trajet.findOne.mockResolvedValueOnce(null);
      Trajet.findOne.mockResolvedValueOnce(null);
      const mockCamion = { _id: 'c1', alerteMaintenance: false, statut: 'DISPONIBLE' };
      const mockRemorque = { _id: 'r1', alerteMaintenance: false, statut: 'DISPONIBLE' };
      const mockChauffeur = { _id: 'ch1', role: 'CHAUFFEUR', isSuspended: false };

      Camion.findOne.mockResolvedValueOnce(mockCamion);
      Remorque.findOne.mockResolvedValueOnce(mockRemorque);
      User.findOne.mockResolvedValueOnce(mockChauffeur);
      Trajet.findOne.mockResolvedValueOnce(null);

      const dispo = await trajetService.verifierDisponibilite('c1', 'r1', 'ch1');
      expect(dispo).toEqual({
        camion: mockCamion,
        remorque: mockRemorque,
        chauffeur: mockChauffeur,
      });
    });
  });

  describe('creerTrajet', () => {
    it('devrait créer le trajet et passer camion et remorque à EN_TRAJET', async () => {
      const mockCamion = { _id: 'c1', alerteMaintenance: false, statut: 'DISPONIBLE', save: jest.fn().mockResolvedValue(true) };
      const mockRemorque = { _id: 'r1', alerteMaintenance: false, statut: 'DISPONIBLE', save: jest.fn().mockResolvedValue(true) };
      const mockChauffeur = { _id: 'ch1', role: 'CHAUFFEUR', estSuspendu: false };

      jest.spyOn(trajetService, 'verifierDisponibilite').mockResolvedValueOnce({
        camion: mockCamion,
        remorque: mockRemorque,
        chauffeur: mockChauffeur,
      });

      const donneesCreation = {
        camion: 'c1',
        remorque: 'r1',
        chauffeur: 'ch1',
        pointDepart: 'Casablanca',
        pointArrivee: 'Tanger',
      };

      const mockTrajetCree = { _id: 'trajetCree1', ...donneesCreation };
      Trajet.create.mockResolvedValueOnce(mockTrajetCree);

      const resultat = await trajetService.creerTrajet(donneesCreation);

      expect(mockCamion.statut).toBe('EN_TRAJET');
      expect(mockCamion.save).toHaveBeenCalled();
      expect(mockRemorque.statut).toBe('EN_TRAJET');
      expect(mockRemorque.save).toHaveBeenCalled();
      expect(resultat).toEqual(mockTrajetCree);
    });
  });

  describe('recupererTousLesTrajets', () => {
    it('devrait récupérer tous les trajets non archivés avec populate', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce([{ _id: 'trajet1' }]);

      Trajet.find.mockReturnValue(mockQuery);

      const res = await trajetService.recupererTousLesTrajets();
      expect(Trajet.find).toHaveBeenCalledWith({ estArchive: false });
      expect(res).toEqual([{ _id: 'trajet1' }]);
    });
  });

  describe('recupererTrajetsParChauffeur', () => {
    it('devrait récupérer les trajets d\'un chauffeur avec populate', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce([{ _id: 'trajet1', chauffeur: 'ch1' }]);

      Trajet.find.mockReturnValue(mockQuery);

      const res = await trajetService.recupererTrajetsParChauffeur('ch1');
      expect(Trajet.find).toHaveBeenCalledWith({ chauffeur: 'ch1', estArchive: false });
      expect(res).toEqual([{ _id: 'trajet1', chauffeur: 'ch1' }]);
    });
  });

  describe('recupererTrajetParId', () => {
    it('devrait lever un NotFoundError si le trajet est introuvable', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(null);

      Trajet.findOne.mockReturnValue(mockQuery);

      await expect(
        trajetService.recupererTrajetParId('idInexistant', { role: 'ADMIN' })
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait lever un BadRequestError si un chauffeur tente d\'accéder au trajet d\'un autre', async () => {
      const mockTrajet = {
        _id: 't1',
        chauffeur: { _id: { toString: () => 'autreChauffeur' } },
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(mockTrajet);

      Trajet.findOne.mockReturnValue(mockQuery);

      await expect(
        trajetService.recupererTrajetParId('t1', { _id: 'monId', role: 'CHAUFFEUR' })
      ).rejects.toThrow(BadRequestError);
    });

    it('devrait retourner le trajet pour un administrateur', async () => {
      const mockTrajet = {
        _id: 't1',
        chauffeur: { _id: { toString: () => 'ch1' } },
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(mockTrajet);

      Trajet.findOne.mockReturnValue(mockQuery);

      const res = await trajetService.recupererTrajetParId('t1', { _id: 'adminId', role: 'ADMIN' });
      expect(res).toBe(mockTrajet);
    });
  });

  describe('demarrerTrajet', () => {
    it('devrait mettre à jour le statut à EN_COURS lorsque les données sont valides', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'chauffeur1',
        statut: 'A_FAIRE',
        kilometrageDepart: null,
        save: jest.fn().mockResolvedValue(true),
      };

      Trajet.findOne.mockResolvedValue(mockTrajet);

      const resultat = await trajetService.demarrerTrajet('trajet1', 'chauffeur1', 3000);

      expect(Trajet.findOne).toHaveBeenCalledWith({ _id: 'trajet1', estArchive: false });
      expect(mockTrajet.kilometrageDepart).toBe(3000);
      expect(mockTrajet.statut).toBe('EN_COURS');
      expect(mockTrajet.save).toHaveBeenCalled();
      expect(resultat.statut).toBe('EN_COURS');
    });

    it('devrait lever un NotFoundError si le trajet est introuvable', async () => {
      Trajet.findOne.mockResolvedValue(null);

      await expect(
        trajetService.demarrerTrajet('inconnu', 'chauffeur1', 3000)
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait lever un BadRequestError si un chauffeur non assigné tente de démarrer le trajet', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'chauffeur1',
        statut: 'A_FAIRE',
      };

      Trajet.findOne.mockResolvedValue(mockTrajet);

      await expect(
        trajetService.demarrerTrajet('trajet1', 'autreChauffeur', 3000)
      ).rejects.toThrow(BadRequestError);
    });

    it('devrait lever un BadRequestError si le statut actuel n\'est pas A_FAIRE', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'chauffeur1',
        statut: 'EN_COURS',
      };

      Trajet.findOne.mockResolvedValue(mockTrajet);

      await expect(
        trajetService.demarrerTrajet('trajet1', 'chauffeur1', 3000)
      ).rejects.toThrow(BadRequestError);
    });

    it('devrait lever un BadRequestError si le kilométrage de départ est nul ou négatif', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'chauffeur1',
        statut: 'A_FAIRE',
      };

      Trajet.findOne.mockResolvedValue(mockTrajet);

      await expect(
        trajetService.demarrerTrajet('trajet1', 'chauffeur1', 0)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('terminerTrajet', () => {
    it('devrait lever un NotFoundError si le trajet est introuvable lors de la clôture', async () => {
      Trajet.findOne.mockResolvedValue(null);

      await expect(
        trajetService.terminerTrajet('inconnu', 'ch1', {
          kilometrageArrivee: 3500,
          volumeGasoilConsommeLitres: 40,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait lever un BadRequestError si un chauffeur non assigné tente de clôturer le trajet', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'ch1',
        statut: 'EN_COURS',
        kilometrageDepart: 3000,
      };

      Trajet.findOne.mockResolvedValue(mockTrajet);

      await expect(
        trajetService.terminerTrajet('trajet1', 'autreChauffeur', {
          kilometrageArrivee: 3500,
          volumeGasoilConsommeLitres: 40,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('devrait lever un BadRequestError si le statut du trajet n\'est pas EN_COURS', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'ch1',
        statut: 'A_FAIRE',
        kilometrageDepart: 3000,
      };

      Trajet.findOne.mockResolvedValue(mockTrajet);

      await expect(
        trajetService.terminerTrajet('trajet1', 'ch1', {
          kilometrageArrivee: 3500,
          volumeGasoilConsommeLitres: 40,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('devrait lever un BadRequestError si le volume de gasoil est nul ou invalide', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'ch1',
        statut: 'EN_COURS',
        kilometrageDepart: 3000,
      };

      Trajet.findOne.mockResolvedValue(mockTrajet);

      await expect(
        trajetService.terminerTrajet('trajet1', 'ch1', {
          kilometrageArrivee: 3500,
          volumeGasoilConsommeLitres: 0,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('devrait terminer le trajet et mettre à jour le carburant, le camion et les pneus', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'ch1',
        camion: 'camion1',
        remorque: 'remorque1',
        statut: 'EN_COURS',
        kilometrageDepart: 3000,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockCamion = {
        _id: 'camion1',
        kilometrageActuel: 10000,
        dernierKilometrageVidange: 9500,
        periodiciteVidangeKm: 10000,
        statut: 'EN_TRAJET',
        save: jest.fn().mockResolvedValue(true),
      };

      const mockPneus = [
        {
          _id: 'pneu1',
          kilometrageActuel: 31000,
          kilometrageMax: 40000,
          statut: 'BON_ETAT',
          save: jest.fn().mockResolvedValue(true),
        },
      ];

      Trajet.findOne.mockResolvedValue(mockTrajet);
      Camion.findById.mockResolvedValue(mockCamion);
      Pneu.find.mockResolvedValue(mockPneus);
      Remorque.findByIdAndUpdate.mockResolvedValue(true);

      const donneesFin = {
        kilometrageArrivee: 3400, // Distance = 400 km
        volumeGasoilConsommeLitres: 50,
        remarquesChauffeur: 'Mission sans encombre',
      };

      const resultat = await trajetService.terminerTrajet('trajet1', 'ch1', donneesFin);

      expect(mockTrajet.statut).toBe('TERMINE');
      expect(mockTrajet.kilometrageArrivee).toBe(3400);
      expect(mockTrajet.coutCarburant).toBe(50 * 13); // 650 MAD
      expect(mockCamion.kilometrageActuel).toBe(10400);
      expect(mockCamion.statut).toBe('DISPONIBLE');
      expect(mockPneus[0].kilometrageActuel).toBe(31400);
      expect(Remorque.findByIdAndUpdate).toHaveBeenCalledWith('remorque1', {
        statut: 'DISPONIBLE',
      });
      expect(resultat.statut).toBe('TERMINE');
    });

    it('devrait lever un BadRequestError si le kilométrage d’arrivée est inférieur ou égal au départ', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'ch1',
        statut: 'EN_COURS',
        kilometrageDepart: 3000,
      };

      Trajet.findOne.mockResolvedValue(mockTrajet);

      const donneesInvalides = {
        kilometrageArrivee: 2800,
        volumeGasoilConsommeLitres: 40,
      };

      await expect(
        trajetService.terminerTrajet('trajet1', 'ch1', donneesInvalides)
      ).rejects.toThrow(BadRequestError);
    });

    it('devrait déclencher une alerte de maintenance si le seuil de vidange est atteint', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'ch1',
        camion: 'camion1',
        remorque: 'remorque1',
        statut: 'EN_COURS',
        kilometrageDepart: 3000,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockCamion = {
        _id: 'camion1',
        kilometrageActuel: 9800,
        dernierKilometrageVidange: 0,
        periodiciteVidangeKm: 10000,
        statut: 'EN_TRAJET',
        alerteMaintenance: false,
        save: jest.fn().mockResolvedValue(true),
      };
      Trajet.findOne.mockResolvedValue(mockTrajet);
      Camion.findById.mockResolvedValue(mockCamion);
      Pneu.find.mockResolvedValue([]);
      Remorque.findByIdAndUpdate.mockResolvedValue(true);
      const donneesFin = {
        kilometrageArrivee: 3300, // Distance = 300 km -> nouveauKm = 10100 (>= 10000)
        volumeGasoilConsommeLitres: 35,
      };
      await trajetService.terminerTrajet('trajet1', 'ch1', donneesFin);
      expect(mockCamion.statut).toBe('EN_MAINTENANCE');
      expect(mockCamion.alerteMaintenance).toBe(true);
      expect(mockCamion.save).toHaveBeenCalled();
    });

    it('devrait mettre le statut du pneu à A_REMPLACER si le kilométrage atteint le seuil maximal', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'ch1',
        camion: 'camion1',
        remorque: 'remorque1',
        statut: 'EN_COURS',
        kilometrageDepart: 3000,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockCamion = {
        _id: 'camion1',
        kilometrageActuel: 5000,
        dernierKilometrageVidange: 5000,
        periodiciteVidangeKm: 10000,
        statut: 'EN_TRAJET',
        save: jest.fn().mockResolvedValue(true),
      };
      const mockPneu = {
        _id: 'pneu1',
        kilometrageActuel: 39900,
        kilometrageMax: 40000,
        statut: 'BON_ETAT',
        save: jest.fn().mockResolvedValue(true),
      };

      Trajet.findOne.mockResolvedValue(mockTrajet);
      Camion.findById.mockResolvedValue(mockCamion);
      Pneu.find.mockResolvedValue([mockPneu]);
      Remorque.findByIdAndUpdate.mockResolvedValue(true);

      await trajetService.terminerTrajet('trajet1', 'ch1', {
        kilometrageArrivee: 3200, // 200 km parcourus -> 39900 + 200 = 40100 >= 40000
        volumeGasoilConsommeLitres: 25,
      });

      expect(mockPneu.statut).toBe('A_REMPLACER');
      expect(mockPneu.save).toHaveBeenCalled();
    });

    it('devrait mettre le statut du pneu à A_VERIFIER si le kilométrage dépasse 80% du seuil maximal', async () => {
      const mockTrajet = {
        _id: 'trajet1',
        chauffeur: 'ch1',
        camion: 'camion1',
        remorque: 'remorque1',
        statut: 'EN_COURS',
        kilometrageDepart: 3000,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockCamion = {
        _id: 'camion1',
        kilometrageActuel: 5000,
        dernierKilometrageVidange: 5000,
        periodiciteVidangeKm: 10000,
        statut: 'EN_TRAJET',
        save: jest.fn().mockResolvedValue(true),
      };
      const mockPneu = {
        _id: 'pneu1',
        kilometrageActuel: 31900,
        kilometrageMax: 40000, // 80% = 32000
        statut: 'BON_ETAT',
        save: jest.fn().mockResolvedValue(true),
      };

      Trajet.findOne.mockResolvedValue(mockTrajet);
      Camion.findById.mockResolvedValue(mockCamion);
      Pneu.find.mockResolvedValue([mockPneu]);
      Remorque.findByIdAndUpdate.mockResolvedValue(true);

      await trajetService.terminerTrajet('trajet1', 'ch1', {
        kilometrageArrivee: 3200, // 200 km parcourus -> 31900 + 200 = 32100 >= 32000
        volumeGasoilConsommeLitres: 25,
      });

      expect(mockPneu.statut).toBe('A_VERIFIER');
      expect(mockPneu.save).toHaveBeenCalled();
    });
  });
});
