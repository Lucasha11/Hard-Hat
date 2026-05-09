import {Router} from 'express';
const router = Router();
import reviewData from '../data/reviews.js';
import reportData from '../data/reports.js';
import validation from '../data/validation.js';
import {requireLogin} from '../middleware/auth.js';

const getUserIdFromSession = (req) => {
  if (!req.session || !req.session.user) throw 'Error: You must be logged in';

  const userId = req.session.user.userId || req.session.user._id;
  if (!userId) throw 'Error: User id not found in session';

  return validation.checkId(userId.toString());
};

// Feature 7: My Activity
// These routes use the logged-in user's session id so users can only manage their own posts.
router.get('/', requireLogin, async (req, res) => {
  try {
    const userId = getUserIdFromSession(req);
    const reviews = await reviewData.getReviewsByUserId(userId);
    const reports = await reportData.getReportsByUserId(userId);

    res.render('activity/myActivity', {
      title: 'My Activity',
      userId,
      reviews,
      reports,
      reviewCount: reviews.length,
      reportCount: reports.length,
      hasReviews: reviews.length > 0,
      hasReports: reports.length > 0
    });
  } catch (e) {
    res.status(400).render('error', {
      title: 'Error',
      error: e.toString()
    });
  }
});

router.put('/reviews/:reviewId', requireLogin, async (req, res) => {
  try {
    const userId = getUserIdFromSession(req);
    const updatedReview = await reviewData.updateReview(req.params.reviewId, userId, req.body);    res.json(updatedReview);
  } catch (e) {
    res.status(400).json({error: e.toString()});
  }
});

router.delete('/reviews/:reviewId', requireLogin, async (req, res) => {
  try {
    const userId = getUserIdFromSession(req);
    const deletedReview = await reviewData.deleteReview(req.params.reviewId, userId);
    res.json(deletedReview);
  } catch (e) {
    res.status(400).json({error: e.toString()});
  }
});

router.put('/reports/:reportId', requireLogin, async (req, res) => {
  try {
    const userId = getUserIdFromSession(req);
    const updatedReport = await reportData.updateUserReport(req.params.reportId, userId, req.body);
    res.json(updatedReport);
  } catch (e) {
    res.status(400).json({error: e.toString()});
  }
});

router.delete('/reports/:reportId', requireLogin, async (req, res) => {
  try {
    const userId = getUserIdFromSession(req);
    const deletedReport = await reportData.deleteUserReport(req.params.reportId, userId);
    res.json(deletedReport);
  } catch (e) {
    res.status(400).json({error: e.toString()});
  }
});

export default router;
