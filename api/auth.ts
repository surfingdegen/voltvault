import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const { action } = req.query;

  // Simple session check via header
  const isAuthenticated = req.headers.authorization === `Bearer ${process.env.SESSION_SECRET}`;

  try {
    // Login
    if (method === 'POST' && action === 'login') {
      const { password } = req.body;
      
      if (password === process.env.ADMIN_PASSWORD) {
        return res.status(200).json({ 
          success: true,
          token: process.env.SESSION_SECRET 
        });
      }
      
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Logout
    if (method === 'POST' && action === 'logout') {
      return res.status(200).json({ success: true });
    }

    // Check auth status
    if (method === 'GET' && action === 'me') {
      if (isAuthenticated) {
        return res.status(200).json({ isAdmin: true });
      }
      return res.status(401).json({ error: 'Not authenticated' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}
