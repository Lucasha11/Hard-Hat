/**
 * dev_routes.js — temporary testing helpers. REMOVE before production.
 *
 * GET  /dev-login   → sets req.session.user to the seed test account
 * GET  /dev-logout  → clears the session
 * GET  /dev-status  → shows current session user as JSON
 */

import { Router } from 'express';
import { dbConnection } from '../config/mongoConnections.js';

const router = Router();

const TEST_EMAIL = 'tester@hardhat.dev';

router.get('/dev-login', async (req, res) => {
  try {
    const db = await dbConnection();
    const user = await db.collection('users').findOne({ email: TEST_EMAIL });
    if (!user) {
      return res.status(404).send(
        'Test user not found. Run <code>node seed.js</code> first, then refresh.'
      );
    }
    req.session.user = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username
    };
    return res.redirect('/sites/M164-TEST');
  } catch (e) {
    return res.status(500).send(`dev-login error: ${e}`);
  }
});

router.get('/dev-logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/dev-status', (req, res) => {
  res.json({ sessionUser: req.session.user || null });
});

export default router;
