import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function ensureDefaultCategory(): Promise<string> {
  try {
    // Try to find existing "Uncategorized" category
    const existing = await pool.query(
      "SELECT id FROM categories WHERE name = 'Uncategorized' LIMIT 1"
    );
    
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }
    
    // Create it if it doesn't exist
    const result = await pool.query(
      "INSERT INTO categories (name) VALUES ('Uncategorized') RETURNING id"
    );
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error ensuring default category:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const { id } = req.query;

  try {
    if (method === 'GET') {
      if (id) {
        const result = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Video not found' });
        }
        return res.status(200).json(result.rows[0]);
      }
      
      const { categoryId } = req.query;
      let query = 'SELECT * FROM videos ORDER BY created_at DESC';
      let params: any[] = [];
      
      if (categoryId) {
        query = 'SELECT * FROM videos WHERE category_id = $1 ORDER BY created_at DESC';
        params = [categoryId];
      }
      
      const result = await pool.query(query, params);
      return res.status(200).json(result.rows);
    }

    if (method === 'POST') {
      const { title, categoryId, url } = req.body;
      
      if (!title || !url) {
        return res.status(400).json({ error: 'Title and URL are required' });
      }

      // Get or create default category if none provided
      const finalCategoryId = categoryId || await ensureDefaultCategory();

      const result = await pool.query(
        'INSERT INTO videos (title, category_id, url, duration, thumbnail, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
        [title, finalCategoryId, url, '0:00', null]
      );

      return res.status(201).json(result.rows[0]);
    }

    if (method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'Video ID required' });
      }

      const result = await pool.query('DELETE FROM videos WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Video not found' });
      }

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Database error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
