import { Router } from 'express';
import statsData from '../data/stats.js';

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    const [overall, byBorough, topReviewed, topRated, recentReviews] = await Promise.all([
      statsData.getOverallStats(),
      statsData.getStatsByBorough(),
      statsData.getTopReviewedSites(5),
      statsData.getTopRatedSites(5),
      statsData.getRecentReviewsWithSite(5)
    ]);

    return res.render('stats', {
      title: 'Site Statistics',
      overall,
      byBorough,
      hasBorough: byBorough.length > 0,
      topReviewed: topReviewed.map((s) => ({ ...s, _id: s._id.toString() })),
      hasTopReviewed: topReviewed.length > 0,
      topRated: topRated.map((s) => ({ ...s, _id: s._id.toString() })),
      hasTopRated: topRated.length > 0,
      recentReviews,
      hasRecentReviews: recentReviews.length > 0
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Error',
      error: typeof e === 'string' ? e : e.message
    });
  }
});

export default router;
