import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import reviewData from '../data/reviews.js';
import siteData from '../data/constructionSites.js';
import likesData from '../data/reviewLikes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Multer setup ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '../../public/uploads/reviews'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `review-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase())) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
  }
});

// ── Auth guard ────────────────────────────────────────────────────────────────
function requireLogin(req, res, next) {
  if (!req.session.user) {
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(401).json({ error: 'You must be logged in.' });
    }
    return res.redirect('/signin');
  }
  next();
}

const router = Router();

// ── Home ──────────────────────────────────────────────────────────────────────
router.route('/').get(async (req, res) => {
  const LIMIT = 5;
  const MAX_PAGES = 9;

  try {
    const [totalReviews, sessionUserId] = await Promise.all([
      reviewData.getTotalReviewCount(),
      Promise.resolve(req.session.user?._id)
    ]);

    const totalPages = Math.min(MAX_PAGES, Math.ceil(totalReviews / LIMIT));
    let page = parseInt(req.query.page, 10) || 1;
    if (page < 1 || (totalPages > 0 && page > totalPages)) return res.redirect('/');

    const rawReviews = await reviewData.getRecentReviews(page, LIMIT);
    const recentReviews = rawReviews.map((r) => ({
      ...r,
      _id: r._id.toString(),
      userId: r.userId.toString(),
      isOwner: !!(sessionUserId && r.userId.toString() === sessionUserId)
    }));

    const pages = Array.from({ length: totalPages }, (_, i) => ({
      num: i + 1,
      isActive: i + 1 === page,
      url: `/?page=${i + 1}`
    }));

    return res.render('home', {
      title: 'Hard Hat — NYC Construction Reviews',
      recentReviews,
      hasReviews: recentReviews.length > 0,
      paginator: {
        pages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
        prevUrl: `/?page=${page - 1}`,
        nextUrl: `/?page=${page + 1}`
      }
    });
  } catch (e) {
    return res.status(500).render('error', { title: 'Error', error: e.toString() });
  }
});

// ── New review form: GET /reviews/new[?siteId=...] ────────────────────────────
router.route('/reviews/new').get(requireLogin, async (req, res) => {
  const siteId = req.query.siteId ? String(req.query.siteId).trim() : '';

  if (!siteId) {
    return res.render('reviews/createReview', {
      title: 'Write a Review',
      siteLocked: false,
      siteId: '',
      formData: {}
    });
  }

  try {
    const site = await siteData.getSiteById(siteId);
    return res.render('reviews/createReview', {
      title: 'Write a Review',
      siteLocked: true,
      site: { ...site, _id: site._id.toString() },
      siteId,
      formData: {}
    });
  } catch (e) {
    return res.status(404).render('reviews/createReview', {
      title: 'Write a Review',
      siteLocked: false,
      siteId,
      formData: { siteId },
      error: `Site "${siteId}" was not found in our records. Please request it through the new-site request flow.`
    });
  }
});

// ── Create review: POST /reviews ──────────────────────────────────────────────
router.route('/reviews').post(requireLogin, upload.single('photo'), async (req, res) => {
  const siteId = req.body.siteId ? String(req.body.siteId).trim() : '';
  const { title, body, noise, airQuality, constructionSize, workHours } = req.body;
  let site;

  try {
    if (!siteId) throw 'Site ID is required.';

    try {
      site = await siteData.getSiteById(siteId);
    } catch (notFound) {
      throw `Site "${siteId}" was not found in our records or in NYC Open Data. Please request it through the new-site request flow.`;
    }

    // Parse ratings — form sends strings
    const ratings = {
      noise: parseInt(noise, 10),
      airQuality: parseInt(airQuality, 10),
      constructionSize: parseInt(constructionSize, 10),
      workHours: parseInt(workHours, 10)
    };

    const photoUrls = req.file ? [`/uploads/reviews/${req.file.filename}`] : [];

    const { _id: userId, username } = req.session.user;

    await reviewData.createReview(siteId, userId, username, ratings, title, body, photoUrls);
    return res.redirect(`/sites/${siteId}`);
  } catch (e) {
    const errMsg = typeof e === 'string' ? e : e.message;
    return res.status(400).render('reviews/createReview', {
      title: 'Write a Review',
      siteLocked: !!site,
      site: site ? { ...site, _id: site._id.toString() } : undefined,
      siteId,
      error: errMsg,
      formData: req.body
    });
  }
});

// ── Edit review form: GET /reviews/:reviewId/edit ─────────────────────────────
router.route('/reviews/:reviewId/edit').get(requireLogin, async (req, res) => {
  const { reviewId } = req.params;
  try {
    const review = await reviewData.getReviewById(reviewId);

    if (review.userId.toString() !== req.session.user._id) {
      return res
        .status(403)
        .render('error', { title: 'Forbidden', error: 'You can only edit your own reviews.' });
    }

    const site = await siteData.getSiteById(review.siteId);
    return res.render('reviews/editReview', {
      title: 'Edit Review',
      review: { ...review, _id: review._id.toString(), userId: review.userId.toString() },
      site: { ...site, _id: site._id.toString() }
    });
  } catch (e) {
    return res
      .status(404)
      .render('error', { title: 'Not Found', error: typeof e === 'string' ? e : e.message });
  }
});

// ── Update review: POST /reviews/:reviewId/edit ───────────────────────────────
router
  .route('/reviews/:reviewId/edit')
  .post(requireLogin, upload.single('photo'), async (req, res) => {
    const { reviewId } = req.params;
    const { title, body, noise, airQuality, constructionSize, workHours } = req.body;
    let review, site;

    try {
      review = await reviewData.getReviewById(reviewId);

      if (review.userId.toString() !== req.session.user._id) {
        return res
          .status(403)
          .render('error', { title: 'Forbidden', error: 'You can only edit your own reviews.' });
      }

      site = await siteData.getSiteById(review.siteId);

      const ratings = {
        noise: parseInt(noise, 10),
        airQuality: parseInt(airQuality, 10),
        constructionSize: parseInt(constructionSize, 10),
        workHours: parseInt(workHours, 10)
      };

      // Keep existing photos unless a new one is uploaded
      const photoUrls = req.file
        ? [`/uploads/reviews/${req.file.filename}`]
        : review.photoUrls || [];

      await reviewData.updateReview(reviewId, req.session.user._id, {
        title,
        body,
        ratings,
        photoUrls
      });

      return res.redirect(`/sites/${review.siteId}`);
    } catch (e) {
      return res.status(400).render('reviews/editReview', {
        title: 'Edit Review',
        review: review
          ? { ...review, _id: review._id.toString(), userId: review.userId.toString() }
          : {},
        site: site ? { ...site, _id: site._id.toString() } : {},
        error: typeof e === 'string' ? e : e.message
      });
    }
  });

// ── Delete review: POST /reviews/:reviewId/delete ────────────────────────────
router.route('/reviews/:reviewId/delete').post(requireLogin, async (req, res) => {
  const { reviewId } = req.params;
  const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';

  try {
    const review = await reviewData.getReviewById(reviewId);

    if (review.userId.toString() !== req.session.user._id) {
      if (isAjax) return res.status(403).json({ error: 'You can only delete your own reviews.' });
      return res
        .status(403)
        .render('error', { title: 'Forbidden', error: 'You can only delete your own reviews.' });
    }

    const siteId = review.siteId;
    await reviewData.deleteReview(reviewId, req.session.user._id);

    if (isAjax) return res.json({ success: true });
    return res.redirect(`/sites/${siteId}`);
  } catch (e) {
    const msg = typeof e === 'string' ? e : e.message;
    if (isAjax) return res.status(500).json({ error: msg });
    return res.status(500).render('error', { title: 'Error', error: msg });
  }
});

// ── Site detail: GET /sites/:siteId ───────────────────────────────────────────
router.route('/sites/:siteId').get(async (req, res) => {
  const { siteId } = req.params;
  try {
    const site = await siteData.getSiteById(siteId);
    const sortBy = req.query.sort || 'newest';
    const allReviews = await reviewData.getReviewsBySiteId(siteId, sortBy);

    const userId = req.session.user?._id;

    const reviewIds = allReviews.map((r) => r._id.toString());
    const reviewsLikedByUser = userId
      ? await likesData.getLikedReviewIds(userId, reviewIds)
      : new Set();

    const reviewList = allReviews.map((r) => ({
      ...r,
      _id: r._id.toString(),
      userId: r.userId.toString(),
      isOwner: !!(userId && r.userId.toString() === userId),
      likedByUser: reviewsLikedByUser.has(r._id.toString()),
      likeCount: r.likeCount || 0
    }));

    return res.render('sites/siteDetail', {
      title: site.schoolName,
      site: { ...site, _id: site._id.toString() },
      reviews: reviewList,
      hasReviews: reviewList.length > 0,
      sortBy,
      sortNewest: sortBy === 'newest',
      sortMostLiked: sortBy === 'most_liked'
    });
  } catch (e) {
    return res
      .status(404)
      .render('error', { title: 'Not Found', error: typeof e === 'string' ? e : e.message });
  }
});

// ── API: GET /api/sites/:siteId/reviews?sort=newest|most_liked ────────────────
router.route('/api/sites/:siteId/reviews').get(async (req, res) => {
  const { siteId } = req.params;
  try {
    const sortBy = req.query.sort || 'newest';
    const allReviews = await reviewData.getReviewsBySiteId(siteId, sortBy);
    const userId = req.session.user?._id;

    const reviewIds = allReviews.map((r) => r._id.toString());
    const likedByUserSet = userId
      ? await likesData.getLikedReviewIds(userId, reviewIds)
      : new Set();

    const reviews = allReviews.map((r) => ({
      _id: r._id.toString(),
      siteId: r.siteId,
      userId: r.userId.toString(),
      username: r.username,
      ratings: r.ratings,
      title: r.title,
      body: r.body,
      photoUrls: r.photoUrls || [],
      likeCount: r.likeCount || 0,
      createdAt: r.createdAt,
      isOwner: !!(userId && r.userId.toString() === userId),
      likedByUser: likedByUserSet.has(r._id.toString())
    }));

    return res.json({ reviews });
  } catch (e) {
    return res.status(500).json({ error: typeof e === 'string' ? e : e.message });
  }
});

router.route('/api/reviews/:reviewId/like').post(async (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ error: 'You must be logged in to like reviews.' });
  try {
    const { reviewId } = req.params;
    const loggedInUserId = req.session.user._id;
    const result = await likesData.toggleLike(reviewId, loggedInUserId);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: typeof e === 'string' ? e : e.message });
  }
});

export default router;
