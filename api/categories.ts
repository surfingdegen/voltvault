import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  try {
    // GET all categories with video counts
    if (method === 'GET') {
      const categoriesResult = await pool.query('SELECT * FROM categories ORDER BY name');
      const videosResult = await pool.query('SELECT category_id, COUNT(*) as count FROM videos GROUP BY category_id');
      
      const videoCounts = videosResult.rows.reduce((acc: any, row: any) => {
        acc[row.category_id] = parseInt(row.count);
        return acc;
      }, {});

      const categoriesWithCount = categoriesResult.rows.map(cat => ({
        ...cat,
        count: videoCounts[cat.id] || 0
      }));

      return res.status(200).json(categoriesWithCount);
    }

    // POST new category
    if (method === 'POST') {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Category name required' });
      }

      const result = await pool.query(
        'INSERT INTO categories (name) VALUES ($1) RETURNING *',
        [name]
      );

      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}
