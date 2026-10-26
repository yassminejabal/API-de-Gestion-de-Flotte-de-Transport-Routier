const { ConflictError, NotFoundError } = require('../../src/utils/AppError');
global.ConflictError = ConflictError;
global.NotFoundError = NotFoundError;
const remorqueService = require('../../src/services/RemorqueService');
const Remorque = require('../../src/models/remorqueModel');

jest.mock('../../src/models/remorqueModel');

describe('Suite de tests unitaires - RemorqueService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('creerRemorque', () => {
    it('devrait lever un ConflictError si la remorque existe déjà', async () => {
      Remorque.findOne.mockResolvedValueOnce({ _id: 'r1', immatriculation: 'REM-100' });

      await expect(
        remorqueService.creerRemorque({ immatriculation: 'REM-100', type: 'BENNE', capaciteMaxKg: 20000 })
      ).rejects.toThrow(ConflictError);
    });

    it('devrait créer et renvoyer la nouvelle remorque', async () => {
      Remorque.findOne.mockResolvedValueOnce(null);
      const mockRemorque = {
        _id: 'r1',
        immatriculation: 'REM-100',
        type: 'BENNE',
        capaciteMaxKg: 20000,
        statut: 'DISPONIBLE',
      };
      Remorque.create.mockResolvedValueOnce(mockRemorque);

      const res = await remorqueService.creerRemorque({
        immatriculation: 'REM-100',
        type: 'BENNE',
        capaciteMaxKg: 20000,
      });

      expect(Remorque.create).toHaveBeenCalledWith({
        immatriculation: 'REM-100',
        type: 'BENNE',
        capaciteMaxKg: 20000,
      });
      expect(res).toEqual(mockRemorque);
    });
  });

  describe('recupererToutesLesRemorques', () => {
    it('devrait retourner toutes les remorques non archivées', async () => {
      const mockRemorques = [{ _id: 'r1', immatriculation: 'REM-100' }];
      Remorque.find.mockResolvedValueOnce(mockRemorques);

      const res = await remorqueService.recupererToutesLesRemorques();
      expect(Remorque.find).toHaveBeenCalledWith({ estArchive: false });
      expect(res).toEqual(mockRemorques);
    });
  });

  describe('modifierRemorque', () => {
    it('devrait lever un NotFoundError si la remorque à modifier n\'existe pas', async () => {
      Remorque.findOneAndUpdate.mockResolvedValueOnce(null);

      await expect(
        remorqueService.modifierRemorque('rInconnu', { type: 'CITERNE' })
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait modifier et retourner la remorque mise à jour', async () => {
      const mockModifiee = { _id: 'r1', type: 'CITERNE' };
      Remorque.findOneAndUpdate.mockResolvedValueOnce(mockModifiee);

      const res = await remorqueService.modifierRemorque('r1', { type: 'CITERNE' });
      expect(Remorque.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'r1', estArchive: false },
        { type: 'CITERNE' },
        { new: true }
      );
      expect(res).toEqual(mockModifiee);
    });
  });

  describe('archiverRemorque', () => {
    it('devrait lever un NotFoundError si la remorque à archiver n\'existe pas', async () => {
      Remorque.findOneAndUpdate.mockResolvedValueOnce(null);

      await expect(
        remorqueService.archiverRemorque('rInconnu')
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait archiver la remorque avec succès', async () => {
      const mockArchivee = { _id: 'r1', estArchive: true };
      Remorque.findOneAndUpdate.mockResolvedValueOnce(mockArchivee);

      const res = await remorqueService.archiverRemorque('r1');
      expect(Remorque.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'r1', estArchive: false },
        { estArchive: true },
        { new: true }
      );
      expect(res).toEqual(mockArchivee);
    });
  });
});
