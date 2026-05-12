import { Router } from 'express';
import constructionSitesMethods from '../data/constructionSites.js';

const router = Router();

<<<<<<< HEAD
const NYC_DATASET_URL = 'https://data.cityofnewyork.us/resource/8586-3zfm.json';

async function searchNycOpenData(query) {
  try {
    const url = `${NYC_DATASET_URL}?$q=${encodeURIComponent(query)}&$limit=5`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const records = await res.json();
    if (!Array.isArray(records)) return [];

    return records.map((rec) => ({
      siteId: rec.buildingid,
      label: rec.name || rec.building_address || rec.buildingid,
      sublabel: rec.building_address || rec.borough || null,
      fromNyc: true
    }));
  } catch (_) {
    return [];
  }
}

=======
>>>>>>> features8and10
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [] });

  try {
<<<<<<< HEAD
    const localResults = await constructionSitesMethods.searchSites(q);

    if (localResults.length < 3) {
      const nycResults = await searchNycOpenData(q);

      const localIds = new Set(localResults.map((r) => r.siteId));
      const newFromNyc = nycResults.filter((r) => r.siteId && !localIds.has(r.siteId));

      const combined = [...localResults, ...newFromNyc].slice(0, 10);
      return res.json({ results: combined });
    }

    return res.json({ results: localResults });
=======
    const results = await constructionSitesMethods.searchSites(q);
    return res.json({ results });
>>>>>>> features8and10
  } catch (_) {
    return res.status(500).json({ results: [], error: 'Search failed' });
  }
});
<<<<<<< HEAD

=======
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
>>>>>>> features8and10
export default router;
