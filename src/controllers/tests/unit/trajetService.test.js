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
// jest.mock parller avec jest pour transformer un model a mock pour travailler avec les model : "wahmi model " 
jest.mock('../../../models/TrajetModel');
jest.mock('../../../models/CamionModel');
jest.mock('../../../models/pneuModel');
jest.mock('../../../models/remorqueModel');
jest.mock('../../../models/userModel');

describe('Suite de tests unitaires - TrajetService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
// pour rasembler les test describe
// it description une test
  describe('verifierDisponibilite', () => {
    it('devrait lever un ConflictError si le camion est déjà assigné à un trajet actif', async () => {
        // value lwahmiya 

      Trajet.findOne.mockResolvedValueOnce({ _id: 'trajetActifId' });
        // expect tester la valeur attendie
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

    it('devrait lever un ConflictError si le chauffeur est suspendu', async () => {
      Trajet.findOne.mockResolvedValueOnce(null); // camion actif
      Trajet.findOne.mockResolvedValueOnce(null); // remorque active
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1', statut: 'DISPONIBLE' });
      Remorque.findOne.mockResolvedValueOnce({ _id: 'r1', statut: 'DISPONIBLE' });
      User.findOne.mockResolvedValueOnce({
        _id: 'ch1',
        role: 'CHAUFFEUR',
        estSuspendu: true,
      });

      await expect(
        trajetService.verifierDisponibilite('c1', 'r1', 'ch1')
      ).rejects.toThrow(ConflictError);
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

      // 31000 + 400 = 31400 (31400 < 32000 => pas encore A_VERIFIER)
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
  });
});