import { Router } from 'express';
import constructionSitesMethods from '../data/constructionSites.js';

const router = Router();

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [] });

  try {
    const results = await constructionSitesMethods.searchSites(q);
    return res.json({ results });
  } catch (_) {
    return res.status(500).json({ results: [], error: 'Search failed' });
  }
});

export default router;
