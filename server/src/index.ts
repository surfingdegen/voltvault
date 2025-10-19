/// <reference types="node" />

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from './db';
import { uploadToR2 } from './r2-upload';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Create temporary uploads directory
const uploadsDir = path.join(__dirname, '../temp-uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mov', '.mp4', '.MOV', '.MP4'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .mov and .mp4 files are allowed'));
    }
  }
});

// Simple session storage
const sessions = new Set<string>();

// ============ AUTH ROUTES ============

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  
  if (password === process.env.ADMIN_PASSWORD) {
    const sessionToken = Math.random().toString(36).substring(7);
    sessions.add(sessionToken);
    res.json({ success: true, token: sessionToken });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  const { token } = req.body;
  sessions.delete(token);
  res.json({ success: true });
});

// Auth middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && sessions.has(token)) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// ============ CATEGORY ROUTES ============

app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', requireAuth, async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============ VIDEO ROUTES ============

app.get('/api/videos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, c.name as category_name 
      FROM videos v 
      LEFT JOIN categories c ON v.category_id = c.id 
      ORDER BY v.display_order, v.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

app.post('/api/videos/upload', requireAuth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, categoryId, duration } = req.body;
    const tempPath = req.file.path;
    const fileName = req.file.filename;

    // Upload to R2
    console.log('Uploading to R2...');
    const r2Url = await uploadToR2(tempPath, fileName);
    console.log('Uploaded to R2:', r2Url);

    // Delete temp file
    fs.unlinkSync(tempPath);

    // Get max order
    const maxOrderResult = await pool.query('SELECT MAX(display_order) as max_order FROM videos');
    const nextOrder = (maxOrderResult.rows[0].max_order || 0) + 1;

    // Save to database with R2 URL
    const result = await pool.query(
      'INSERT INTO videos (title, category_id, url, duration, display_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, categoryId || null, r2Url, duration || '0.6s', nextOrder]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

app.delete('/api/videos/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    // Get video info
    const video = await pool.query('SELECT url FROM videos WHERE id = $1', [id]);
    
    // Note: R2 deletion would go here if needed
    // For now, just remove from database

    await pool.query('DELETE FROM videos WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
