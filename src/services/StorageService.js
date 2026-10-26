const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Client');

class StorageService {
  constructor() {
    this.bucketName = process.env.MINIO_BUCKET || 'fleettrack-documents';
  }

  // Téléversement du buffer PDF vers MinIO
  async uploadMissionOrder(pdfBuffer, s3Key) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    });

    await s3Client.send(command);
    return {
      bucket: this.bucketName,
      s3Key,
      sizeBytes: pdfBuffer.length,
    };
  }

  // Génération de la Presigned URL temporaire (15 min = 900s)
  async getPresignedDownloadUrl(s3Key) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 900 });
  }
}

module.exports = new StorageService();