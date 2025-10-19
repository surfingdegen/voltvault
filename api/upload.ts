import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseMultipart(req: VercelRequest): Promise<{ file: Buffer; filename: string } | null> {
  const chunks: Buffer[] = [];
  
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  
  const buffer = Buffer.concat(chunks);
  const boundary = req.headers['content-type']?.split('boundary=')[1];
  
  if (!boundary) return null;
  
  const parts = buffer.toString('binary').split(`--${boundary}`);
  
  for (const part of parts) {
    if (part.includes('Content-Disposition') && part.includes('filename=')) {
      const filenameMatch = part.match(/filename="(.+?)"/);
      if (!filenameMatch) continue;
      
      const filename = filenameMatch[1];
      const contentStart = part.indexOf('\r\n\r\n') + 4;
      const contentEnd = part.lastIndexOf('\r\n');
      
      if (contentStart === -1 || contentEnd === -1) continue;
      
      const fileContent = part.substring(contentStart, contentEnd);
      const fileBuffer = Buffer.from(fileContent, 'binary');
      
      return { file: fileBuffer, filename };
    }
  }
  
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsed = await parseMultipart(req);
    
    if (!parsed) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { file, filename } = parsed;

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = filename.split('.').pop() || 'mp4';
    const uniqueFilename = `videos/${timestamp}-${random}.${extension}`;

    const blob = await put(uniqueFilename, file, {
      access: 'public',
      contentType: 'video/mp4',
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
