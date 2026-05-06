import { Router } from 'express';
import profileData from '../data/profile.js';

const router = Router();

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/signin');
  next();
}

// ── View profile ──────────────────────────────────────────────────────────────
router.get('/profile', requireLogin, async (req, res) => {
  try {
    const { user, reviews, savedSites } = await profileData.getProfileByUserId(
      req.session.user._id
    );

    return res.render('profile', {
      title: `${user.firstName} ${user.lastName} — Profile`,
      profileUser: {
        ...user,
        _id: user._id.toString()
      },
      reviews,
      hasReviews: reviews.length > 0,
      savedSites,
      hasSavedSites: savedSites.length > 0,
      reviewCount: reviews.length,
      savedCount: savedSites.length
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Error',
      error: typeof e === 'string' ? e : e.message
    });
  }
});

// ── Edit profile: GET ─────────────────────────────────────────────────────────
router.get('/profile/edit', requireLogin, async (req, res) => {
  try {
    const { user } = await profileData.getProfileByUserId(req.session.user._id);
    return res.render('profileEdit', {
      title: 'Edit Profile',
      profileUser: { ...user, _id: user._id.toString() }
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Error',
      error: typeof e === 'string' ? e : e.message
    });
  }
});

// ── Edit profile: POST ────────────────────────────────────────────────────────
router.post('/profile/edit', requireLogin, async (req, res) => {
  const { firstName, lastName, homeBorough } = req.body;

  try {
    const updated = await profileData.updateProfile(req.session.user._id, {
      firstName,
      lastName,
      homeBorough
    });

    // Keep the session in sync
    req.session.user = {
      ...req.session.user,
      firstName: updated.firstName,
      lastName: updated.lastName
    };

    return res.redirect('/profile');
  } catch (e) {
    const { user } = await profileData.getProfileByUserId(req.session.user._id).catch(() => ({
      user: { firstName, lastName, homeBorough }
    }));
    return res.status(400).render('profileEdit', {
      title: 'Edit Profile',
      profileUser: { ...user, _id: req.session.user._id },
      error: typeof e === 'string' ? e : e.message
    });
  }
});

export default router;
