const { NotFoundError } = require('../../src/utils/AppError');
global.NotFoundError = NotFoundError;
const camionService = require('../../src/services/CamionService');
const Camion = require('../../src/models/CamionModel');

jest.mock('../../src/models/CamionModel');

describe('Suite de tests unitaires - CamionService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('creerCamion', () => {
    it('devrait lever une erreur 400 si des informations obligatoires manquent', async () => {
      await expect(camionService.creerCamion({ marque: 'Renault' })).rejects.toMatchObject({
        message: "L'immatriculation, la marque et le modèle sont obligatoires",
        statusCode: 400,
      });

      await expect(
        camionService.creerCamion({ immatriculation: '123-A-1', modele: 'T480' })
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('devrait lever une erreur 409 si un camion avec la même immatriculation existe déjà', async () => {
      Camion.findOne.mockResolvedValueOnce({ _id: 'c1', immatriculation: '123-A-1' });

      await expect(
        camionService.creerCamion({
          immatriculation: '123-a-1',
          marque: 'Renault',
          modele: 'T480',
        })
      ).rejects.toMatchObject({
        message: 'Un camion avec cette immatriculation existe déjà',
        statusCode: 409,
      });
    });

    it('devrait créer et retourner un nouveau camion avec le statut DISPONIBLE', async () => {
      Camion.findOne.mockResolvedValueOnce(null);

      const mockNouveauCamion = {
        _id: 'c1',
        immatriculation: '123-A-1',
        marque: 'Renault',
        modele: 'T480',
        kilometrageActuel: 10000,
        statut: 'DISPONIBLE',
      };

      Camion.create.mockResolvedValueOnce(mockNouveauCamion);

      const resultat = await camionService.creerCamion({
        immatriculation: '123-A-1',
        marque: 'Renault',
        modele: 'T480',
        kilometrageActuel: 10000,
      });

      expect(Camion.create).toHaveBeenCalledWith({
        immatriculation: '123-A-1',
        marque: 'Renault',
        modele: 'T480',
        kilometrageActuel: 10000,
        statut: 'DISPONIBLE',
      });
      expect(resultat).toEqual(mockNouveauCamion);
    });
  });

  describe('recupererTousLesCamions', () => {
    it('devrait retourner la liste de tous les camions', async () => {
      const mockCamions = [{ _id: 'c1', immatriculation: '123-A-1' }];
      Camion.find.mockResolvedValueOnce(mockCamions);

      const res = await camionService.recupererTousLesCamions();
      expect(Camion.find).toHaveBeenCalled();
      expect(res).toEqual(mockCamions);
    });
  });

  describe('modifierCamion', () => {
    it('devrait lever un NotFoundError si le camion à modifier n\'existe pas', async () => {
      Camion.findByIdAndUpdate.mockResolvedValueOnce(null);

      await expect(
        camionService.modifierCamion('idInconnu', { marque: 'Scania' })
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait modifier et renvoyer le camion mis à jour', async () => {
      const mockCamion = { _id: 'c1', marque: 'Scania', modele: 'R500' };
      Camion.findByIdAndUpdate.mockResolvedValueOnce(mockCamion);

      const res = await camionService.modifierCamion('c1', { marque: 'Scania' });

      expect(Camion.findByIdAndUpdate).toHaveBeenCalledWith(
        'c1',
        { marque: 'Scania' },
        { new: true, runValidators: true }
      );
      expect(res).toEqual(mockCamion);
    });
  });

  describe('archiverCamion', () => {
    it('devrait lever un NotFoundError si le camion à archiver est introuvable', async () => {
      Camion.findOneAndUpdate.mockResolvedValueOnce(null);

      await expect(
        camionService.archiverCamion('idInconnu')
      ).rejects.toThrow(NotFoundError);
    });

    it('devrait archiver le camion avec succès', async () => {
      const mockCamionArchive = { _id: 'c1', estArchive: true };
      Camion.findOneAndUpdate.mockResolvedValueOnce(mockCamionArchive);

      const res = await camionService.archiverCamion('c1');

      expect(Camion.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'c1', estArchive: false },
        { estArchive: true },
        { new: true }
      );
      expect(res).toEqual(mockCamionArchive);
    });
  });
});
