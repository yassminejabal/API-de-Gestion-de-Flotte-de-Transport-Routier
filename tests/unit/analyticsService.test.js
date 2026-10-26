const analyticsService = require('../../src/services/analyticsService');
const Trajet = require('../../src/models/TrajetModel');
const Pneu = require('../../src/models/pneuModel');

jest.mock('../../src/models/TrajetModel');
jest.mock('../../src/models/pneuModel');
// Also mock with uppercase if needed due to require('../models/PneuModel')
jest.mock('../../src/models/PneuModel', () => jest.requireMock('../../src/models/pneuModel'), { virtual: true });

describe('Suite de tests unitaires - AnalyticsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTiresHealthMatrix', () => {
    it('devrait retourner la matrice d\'état des pneus lorsque l\'agrégation retourne des données', async () => {
      const mockResultat = [
        {
          _id: 'AVANT_GAUCHE',
          nombrePneus: 4,
          kilometrageMoyen: 25000,
          nombrePneusCritiques: 1,
          budgetEstime: 3800,
        },
        {
          _id: 'ARRIERE_DROITE',
          nombrePneus: 8,
          kilometrageMoyen: 15000,
          nombrePneusCritiques: 0,
          budgetEstime: 0,
        },
      ];

      Pneu.aggregate.mockResolvedValueOnce(mockResultat);

      const resultat = await analyticsService.getTiresHealthMatrix();

      expect(Pneu.aggregate).toHaveBeenCalledTimes(1);
      const pipeline = Pneu.aggregate.mock.calls[0][0];
      expect(Array.isArray(pipeline)).toBe(true);
      expect(pipeline.length).toBe(4);
      expect(resultat).toEqual(mockResultat);
    });

    it('devrait retourner un tableau vide lorsque l\'agrégation ne trouve aucun pneu', async () => {
      Pneu.aggregate.mockResolvedValueOnce([]);

      const resultat = await analyticsService.getTiresHealthMatrix();

      expect(Pneu.aggregate).toHaveBeenCalledTimes(1);
      expect(resultat).toEqual([]);
    });

    it('devrait propager l\'erreur lorsque MongoDB rencontre une exception', async () => {
      const mongoError = new Error('Erreur de connexion MongoDB');
      Pneu.aggregate.mockRejectedValueOnce(mongoError);

      await expect(analyticsService.getTiresHealthMatrix()).rejects.toThrow(
        'Erreur de connexion MongoDB'
      );
    });
  });

  describe('getDriversEcoPerformance', () => {
    it('devrait retourner les scores d\'éco-conduite calculés par l\'agrégation', async () => {
      const mockEcoData = [
        {
          _id: 'chauffeur1',
          totalGasoil: 120,
          distanceTotale: 400,
          consommationMoyenne: 30,
          scoreEco: 100,
        },
        {
          _id: 'chauffeur2',
          totalGasoil: 160,
          distanceTotale: 400,
          consommationMoyenne: 40,
          scoreEco: 75,
        },
      ];

      Trajet.aggregate.mockResolvedValueOnce(mockEcoData);

      const resultat = await analyticsService.getDriversEcoPerformance();

      expect(Trajet.aggregate).toHaveBeenCalledTimes(1);
      const pipeline = Trajet.aggregate.mock.calls[0][0];
      expect(Array.isArray(pipeline)).toBe(true);
      expect(resultat).toEqual(mockEcoData);
    });

    it('devrait propager les erreurs MongoDB lors de l\'analyse éco-performance', async () => {
      const dbError = new Error('Database timeout');
      Trajet.aggregate.mockRejectedValueOnce(dbError);

      await expect(analyticsService.getDriversEcoPerformance()).rejects.toThrow('Database timeout');
    });
  });
});
