import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from './src/config/s3Client.js';

async function generateUploadUrl() {
  const command = new PutObjectCommand({
    Bucket: 'fleettrack-documents',
    Key: `test-${Date.now()}.txt`,
    ContentType: 'text/plain'
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 60 });
  console.log('=== PRESIGNED URL ===');
  console.log(url);
}
generateUploadUrl().catch(console.error);