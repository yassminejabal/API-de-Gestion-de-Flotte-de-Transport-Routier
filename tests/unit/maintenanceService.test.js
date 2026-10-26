const maintenanceService = require('../../src/services/MaintenanceService');
const Camion = require('../../src/models/CamionModel');
const Pneu = require('../../src/models/pneuModel');

jest.mock('../../src/models/CamionModel');
jest.mock('../../src/models/pneuModel');

describe('Suite de tests unitaires - MaintenanceService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAlertes', () => {
    it('devrait agréger et retourner les alertes camions et pneus', async () => {
      const mockCamions = [
        {
          immatriculation: '12345-A-1',
          marque: 'Volvo',
          modele: 'FH16',
          kilometrageActuel: 50000,
          statut: 'EN_MAINTENANCE',
        },
      ];
      const mockPneus = [
        {
          numeroSerie: 'PN-001',
          statut: 'A_REMPLACER',
          camion: { immatriculation: '12345-A-1', marque: 'Volvo' },
        },
        {
          numeroSerie: 'PN-002',
          statut: 'A_VERIFIER',
          camion: { immatriculation: '12345-A-1', marque: 'Volvo' },
        },
      ];

      const camionQuery = {
        select: jest.fn().mockResolvedValueOnce(mockCamions),
      };
      Camion.find.mockReturnValue(camionQuery);

      const pneuQuery = {
        populate: jest.fn().mockResolvedValueOnce(mockPneus),
      };
      Pneu.find.mockReturnValue(pneuQuery);

      const result = await maintenanceService.getAlertes();

      expect(Camion.find).toHaveBeenCalledWith({
        $or: [
          { alerteMaintenance: true },
          { statut: 'EN_MAINTENANCE' },
        ],
      });
      expect(camionQuery.select).toHaveBeenCalledWith(
        'immatriculation marque modele kilometrageActuel statut'
      );
      expect(Pneu.find).toHaveBeenCalledWith({
        statut: { $in: ['A_VERIFIER', 'A_REMPLACER'] },
      });
      expect(pneuQuery.populate).toHaveBeenCalledWith('camion', 'immatriculation marque');

      expect(result.totalAlertes).toBe(3);
      expect(result.camions.total).toBe(1);
      expect(result.camions.liste).toEqual(mockCamions);
      expect(result.pneus.total).toBe(2);
      expect(result.pneus.liste).toEqual(mockPneus);
    });

    it('devrait retourner un total de 0 alertes si aucun véhicule ou pneu n\'est en alerte', async () => {
      const camionQuery = {
        select: jest.fn().mockResolvedValueOnce([]),
      };
      Camion.find.mockReturnValue(camionQuery);

      const pneuQuery = {
        populate: jest.fn().mockResolvedValueOnce([]),
      };
      Pneu.find.mockReturnValue(pneuQuery);

      const result = await maintenanceService.getAlertes();

      expect(result.totalAlertes).toBe(0);
      expect(result.camions.total).toBe(0);
      expect(result.camions.liste).toEqual([]);
      expect(result.pneus.total).toBe(0);
      expect(result.pneus.liste).toEqual([]);
    });

    it('devrait propager les erreurs si la recherche échoue', async () => {
      const camionQuery = {
        select: jest.fn().mockRejectedValueOnce(new Error('Erreur base de données')),
      };
      Camion.find.mockReturnValue(camionQuery);

      await expect(maintenanceService.getAlertes()).rejects.toThrow('Erreur base de données');
    });
  });
});
