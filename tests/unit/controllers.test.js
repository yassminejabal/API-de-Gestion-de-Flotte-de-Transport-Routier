const analyticsController = require('../../src/controllers/analyticsController');
const AnalyticsService = require('../../src/services/analyticsService');
const maintenanceController = require('../../src/controllers/MaintenanceController');
const maintenanceService = require('../../src/services/MaintenanceService');

jest.mock('../../src/services/analyticsService');
jest.mock('../../src/services/MaintenanceService');

describe('Suite de tests unitaires - Controllers (Analytics & Maintenance)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AnalyticsController - getTiresHealthMatrix', () => {
    it('devrait retourner le statut 200 et les données de la matrice de pneus', async () => {
      const mockData = [{ _id: 'AVANT', nombrePneus: 2 }];
      AnalyticsService.getTiresHealthMatrix.mockResolvedValueOnce(mockData);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await analyticsController.getTiresHealthMatrix(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait transmettre l\'erreur au middleware next en cas d\'échec', async () => {
      const err = new Error('Erreur interne service');
      AnalyticsService.getTiresHealthMatrix.mockRejectedValueOnce(err);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await analyticsController.getTiresHealthMatrix(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('MaintenanceController - getAlertes', () => {
    it('devrait retourner le statut 200 avec la liste des alertes de maintenance', async () => {
      const mockAlertes = { totalAlertes: 1, camions: { total: 1 }, pneus: { total: 0 } };
      maintenanceService.getAlertes.mockResolvedValueOnce(mockAlertes);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await maintenanceController.getAlertes(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockAlertes,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait passer l\'erreur à next si le service échoue', async () => {
      const err = new Error('Erreur alertes');
      maintenanceService.getAlertes.mockRejectedValueOnce(err);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await maintenanceController.getAlertes(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
