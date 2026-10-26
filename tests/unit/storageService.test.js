const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../../src/config/s3Client');
const storageService = require('../../src/services/StorageService');

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('../../src/config/s3Client', () => ({
  send: jest.fn(),
}));

describe('Suite de tests unitaires - StorageService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadMissionOrder', () => {
    it('devrait envoyer le PDF vers MinIO/S3 et retourner les métadonnées', async () => {
      const buffer = Buffer.from('%PDF-1.4 test content');
      const s3Key = 'missions/ordre-mission-123.pdf';

      s3Client.send.mockResolvedValueOnce({ ETag: '"dummy-etag"' });

      const res = await storageService.uploadMissionOrder(buffer, s3Key);

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: expect.any(String),
        Key: s3Key,
        Body: buffer,
        ContentType: 'application/pdf',
      });
      expect(s3Client.send).toHaveBeenCalledTimes(1);
      expect(res).toEqual({
        bucket: storageService.bucketName,
        s3Key,
        sizeBytes: buffer.length,
      });
    });

    it('devrait propager les erreurs en cas d\'échec de téléversement S3', async () => {
      const buffer = Buffer.from('test');
      s3Client.send.mockRejectedValueOnce(new Error('S3 Access Denied'));

      await expect(
        storageService.uploadMissionOrder(buffer, 'test.pdf')
      ).rejects.toThrow('S3 Access Denied');
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('devrait générer et retourner une URL présignée avec expiration de 900 secondes', async () => {
      const s3Key = 'missions/ordre-mission-123.pdf';
      const fakePresignedUrl = 'https://minio.example.com/fleettrack-documents/missions/ordre-mission-123.pdf?sig=xyz';

      getSignedUrl.mockResolvedValueOnce(fakePresignedUrl);

      const url = await storageService.getPresignedDownloadUrl(s3Key);

      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: storageService.bucketName,
        Key: s3Key,
      });
      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(Object),
        { expiresIn: 900 }
      );
      expect(url).toBe(fakePresignedUrl);
    });

    it('devrait propager les erreurs lors de la génération de l\'URL présignée', async () => {
      getSignedUrl.mockRejectedValueOnce(new Error('Erreur signature S3'));

      await expect(
        storageService.getPresignedDownloadUrl('key.pdf')
      ).rejects.toThrow('Erreur signature S3');
    });
  });
});
