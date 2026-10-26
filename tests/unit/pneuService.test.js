const { ConflictError, BadRequestError, NotFoundError } = require('../../src/utils/AppError');
global.ConflictError = ConflictError;
global.BadRequestError = BadRequestError;
global.NotFoundError = NotFoundError;
const pneuService = require('../../src/services/PneuService');
const Pneu = require('../../src/models/pneuModel');
const Camion = require('../../src/models/CamionModel');

jest.mock('../../src/models/pneuModel');
jest.mock('../../src/models/CamionModel');

describe('Suite de tests unitaires - PneuService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('creerPneu', () => {
    it('devrait lever un ConflictError si le numéro de série existe déjà', async () => {
      Pneu.findOne.mockResolvedValueOnce({ _id: 'p1', numeroSerie: 'SN123' });

      await expect(
        pneuService.creerPneu({ numeroSerie: 'SN123' })
      ).rejects.toThrow(ConflictError);
    });

    it('devrait créer et retourner le nouveau pneu', async () => {
      Pneu.findOne.mockResolvedValueOnce(null);
      const mockPneu = { _id: 'p1', numeroSerie: 'SN123', position: 'AV_G' };
      Pneu.create.mockResolvedValueOnce(mockPneu);

      const res = await pneuService.creerPneu({ numeroSerie: 'SN123', position: 'AV_G' });
      expect(Pneu.create).toHaveBeenCalledWith({ numeroSerie: 'SN123', position: 'AV_G' });
      expect(res).toEqual(mockPneu);
    });
  });

  describe('recupererTousLesPneus', () => {
    it('devrait retourner la liste de tous les pneus non archivés avec populate', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValueOnce([{ _id: 'p1', numeroSerie: 'SN123' }]),
      };
      Pneu.find.mockReturnValue(mockQuery);

      const res = await pneuService.recupererTousLesPneus();
      expect(Pneu.find).toHaveBeenCalledWith({ estArchive: false });
      expect(mockQuery.populate).toHaveBeenCalledWith('camion', 'immatriculation marque modele');
      expect(res).toEqual([{ _id: 'p1', numeroSerie: 'SN123' }]);
    });
  });

  describe('assignerPneuACamion', () => {
    it('devrait lever un BadRequestError si camionId ou position est manquant', async () => {
      await expect(pneuService.assignerPneuACamion('p1', null, 'AV_G')).rejects.toThrow(BadRequestError);
      await expect(pneuService.assignerPneuACamion('p1', 'c1', null)).rejects.toThrow(BadRequestError);
    });

    it('devrait lever un NotFoundError si le pneu est introuvable', async () => {
      Pneu.findOne.mockResolvedValueOnce(null);

      await expect(
        pneuService.assignerPneuACamion('pInconnu', 'c1', 'AV_G')
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait lever un NotFoundError si le camion est introuvable', async () => {
      Pneu.findOne.mockResolvedValueOnce({ _id: 'p1' });
      Camion.findOne.mockResolvedValueOnce(null);

      await expect(
        pneuService.assignerPneuACamion('p1', 'cInconnu', 'AV_G')
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait lever un ConflictError si la position est déjà occupée sur ce camion', async () => {
      Pneu.findOne.mockResolvedValueOnce({ _id: 'p1' });
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1' });
      Pneu.findOne.mockResolvedValueOnce({ _id: 'autrePneu', position: 'AV_G' });

      await expect(
        pneuService.assignerPneuACamion('p1', 'c1', 'AV_G')
      ).rejects.toThrow(ConflictError);
    });

    it('devrait assigner le pneu au camion et mettre à jour sa position', async () => {
      const mockPneu = {
        _id: 'p1',
        camion: null,
        position: null,
        save: jest.fn().mockResolvedValue(true),
      };
      Pneu.findOne.mockResolvedValueOnce(mockPneu); // pneu check
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1' }); // camion check
      Pneu.findOne.mockResolvedValueOnce(null); // position check

      const res = await pneuService.assignerPneuACamion('p1', 'c1', 'AV_G');

      expect(mockPneu.camion).toBe('c1');
      expect(mockPneu.position).toBe('AV_G');
      expect(mockPneu.save).toHaveBeenCalled();
      expect(res).toBe(mockPneu);
    });
  });

  describe('modifierPneu', () => {
    it('devrait lever un NotFoundError si le pneu à modifier n\'existe pas', async () => {
      Pneu.findOneAndUpdate.mockResolvedValueOnce(null);

      await expect(
        pneuService.modifierPneu('pInconnu', { kilometrageActuel: 1000 })
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait modifier et retourner le pneu mis à jour', async () => {
      const mockPneuModifie = { _id: 'p1', kilometrageActuel: 5000 };
      Pneu.findOneAndUpdate.mockResolvedValueOnce(mockPneuModifie);

      const res = await pneuService.modifierPneu('p1', { kilometrageActuel: 5000 });
      expect(Pneu.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'p1', estArchive: false },
        { kilometrageActuel: 5000 },
        { new: true }
      );
      expect(res).toEqual(mockPneuModifie);
    });
  });

  describe('archiverPneu', () => {
    it('devrait lever un NotFoundError si le pneu à archiver est introuvable', async () => {
      Pneu.findOneAndUpdate.mockResolvedValueOnce(null);

      await expect(
        pneuService.archiverPneu('pInconnu')
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait archiver le pneu et dissocier son camion et position', async () => {
      const mockPneuArchive = { _id: 'p1', estArchive: true, camion: null, position: null };
      Pneu.findOneAndUpdate.mockResolvedValueOnce(mockPneuArchive);

      const res = await pneuService.archiverPneu('p1');
      expect(Pneu.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'p1', estArchive: false },
        { estArchive: true, camion: null, position: null },
        { new: true }
      );
      expect(res).toEqual(mockPneuArchive);
    });
  });
});
