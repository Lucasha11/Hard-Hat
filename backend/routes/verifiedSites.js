import {Router} from 'express';
const router = Router();

import constructionSiteData from '../data/constructionSites.js';

router.get('/', async (req, res) => {
  try {
    const verifiedSites = await constructionSiteData.getApprovedSites();

    res.render('sites/verifiedSites', {
      title: 'Verified Sites',
      verifiedSites,
      verifiedSiteCount: verifiedSites.length,
      hasVerifiedSites: verifiedSites.length > 0
    });
  } catch (e) {
    res.status(500).render('error', {
      title: 'Error',
      error: e.toString()
    });
  }
});

export default router;