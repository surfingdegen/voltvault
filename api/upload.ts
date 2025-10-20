import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({ maxFileSize: 500 * 1024 * 1024 });
    
    const [fields, files] = await form.parse(req);
    
    const videoFile = files.video?.[0];
    if (!videoFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = fs.readFileSync(videoFile.filepath);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = videoFile.originalFilename?.split('.').pop() || 'mp4';
    const filename = `videos/${timestamp}-${random}.${extension}`;

    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType: videoFile.mimetype || 'video/mp4',
    });

    console.log('Upload successful:', blob.url);
    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to upload video' 
    });
  }
}
