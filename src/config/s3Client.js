import { S3Client } from '@aws-sdk/client-s3';

// s3client est un class pour la communication avec des servre de amazon comme minio
export const s3 = new S3Client({
    region: 'us-east-1',
    // endpoint : servre de stokage
    endpoint: 'http://localhost:9000',
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadminpassword'
  }
});