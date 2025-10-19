import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const { id } = req.query;

  try {
    // GET all videos or single video
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

    // POST new video
    if (method === 'POST') {
      const { title, categoryId, url } = req.body;
      
      if (!title || !categoryId || !url) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await pool.query(
        'INSERT INTO videos (title, category_id, url, duration, thumbnail) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, categoryId, url, '0:00', null]
      );

      return res.status(201).json(result.rows[0]);
    }

    // DELETE video
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
    return res.status(500).json({ error: 'Database error' });
  }
}
