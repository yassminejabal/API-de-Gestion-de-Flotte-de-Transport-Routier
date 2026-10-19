import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from './s3Client.js';

async function generateUploadUrl() {
  const bucketName = 'fleettrack-documents'; 
  const objectKey = `test-${Date.now()}.txt`;

  // 2. cree objet (PutObjectCommand)
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: 'text/plain'
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 60 });
console.log("url      :");

  console.log(url);
}

generateUploadUrl().catch(console.error);