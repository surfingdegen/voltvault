import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(filePath: string, fileName: string): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  const bucketName = process.env.R2_BUCKET_NAME!;
  
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: fileName,
      Body: fileStream,
      ContentType: 'video/mp4',
      ACL: 'public-read',  // ADD THIS LINE
    },
  });

  await upload.done();
  
  // Return public URL
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
  return publicUrl;
}

export async function deleteFromR2(fileName: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: fileName,
  });
  
  await s3Client.send(command);
}
