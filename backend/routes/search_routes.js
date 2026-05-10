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
router.get('/filter', async (req, res) => {
  try {
    const filters = {
    noise: req.query.noise,
    airQuality: req.query.airQuality,
    workHours: req.query.workHours
    };
    const results = await constructionSitesMethods.filterSites(filters);
    return res.render('search/filter', { title: 'Filtered Sites', results});
  } catch (e) {
    return res.status(500).render('error', {error: e.toString()});
  }
});
export default router;
