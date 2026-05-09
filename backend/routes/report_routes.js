import { Router } from 'express';
import reportData from '../data/reports.js';

// ── Auth guard ──────────────────────────────────────────────────────────────
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/signin');
  }
  next();
}

const router = Router();

// ── Show form to report a missing site: GET /reports/new ───────────────────
router.get('/reports/new', requireLogin, (req, res) => {
  return res.render('reports/newReport', {
    title: 'Report a Missing Site',
    formData: {}
  });
});

// ── Submit new site report: POST /reports/new ──────────────────────────────
router.post('/reports/new', requireLogin, async (req, res) => {
  const { siteId, description } = req.body;
  const userId = req.session.user._id;

  try {
    if (!siteId || !siteId.trim()) throw 'Site ID is required.';
    if (!description || !description.trim()) throw 'Description is required.';

    await reportData.createUserReport(userId, siteId.trim(), description.trim());
    return res.redirect('/my-activity');
  } catch (e) {
    const errMsg = typeof e === 'string' ? e : e.message;
    return res.status(400).render('reports/newReport', {
      title: 'Report a Missing Site',
      error: errMsg,
      formData: req.body
    });
  }
});

// ── Show form to submit an update about an existing site: GET /reports/update ──
router.get('/reports/update', requireLogin, (req, res) => {
  const siteId = (req.query.siteId || '').trim();
  return res.render('reports/siteUpdateReport', {
    title: 'Submit a Site Update',
    siteId,
    formData: { siteId }
  });
});

// ── Submit site update report: POST /reports/update ───────────────────────
router.post('/reports/update', requireLogin, async (req, res) => {
  const { siteId, description } = req.body;
  const userId = req.session.user._id;

  try {
    if (!siteId || !siteId.trim()) throw 'Site ID is required.';
    if (!description || !description.trim()) throw 'Description is required.';

    await reportData.createSiteUpdateReport(userId, siteId.trim(), description.trim());
    return res.redirect('/my-activity');
  } catch (e) {
    const errMsg = typeof e === 'string' ? e : e.message;
    return res.status(400).render('reports/siteUpdateReport', {
      title: 'Submit a Site Update',
      error: errMsg,
      formData: req.body
    });
  }
});

// ── Show edit form: GET /reports/:reportId/edit ────────────────────────────
router.get('/reports/:reportId/edit', requireLogin, async (req, res) => {
  const { reportId } = req.params;
  const userId = req.session.user._id;

  try {
    const report = await reportData.getReportById(reportId);

    if (report.submittedBy.toString() !== userId) {
      return res.status(403).render('error', {
        title: 'Forbidden',
        error: 'You can only edit your own reports.'
      });
    }

    return res.render('reports/editReport', {
      title: 'Edit Report',
      report: { ...report, _id: report._id.toString() }
    });
  } catch (e) {
    return res.status(404).render('error', {
      title: 'Not Found',
      error: typeof e === 'string' ? e : e.message
    });
  }
});

// ── Update report: POST /reports/:reportId/edit ────────────────────────────
router.post('/reports/:reportId/edit', requireLogin, async (req, res) => {
  const { reportId } = req.params;
  const userId = req.session.user._id;
  const { description } = req.body;
  let report;

  try {
    report = await reportData.getReportById(reportId);

    if (report.submittedBy.toString() !== userId) {
      return res.status(403).render('error', {
        title: 'Forbidden',
        error: 'You can only edit your own reports.'
      });
    }

    if (!description || !description.trim()) throw 'Description is required.';

    await reportData.updateUserReport(reportId, userId, { description: description.trim() });
    return res.redirect('/my-activity');
  } catch (e) {
    const errMsg = typeof e === 'string' ? e : e.message;
    return res.status(400).render('reports/editReport', {
      title: 'Edit Report',
      error: errMsg,
      report: report ? { ...report, _id: report._id.toString() } : {}
    });
  }
});

// ── Delete report: POST /reports/:reportId/delete ──────────────────────────
router.post('/reports/:reportId/delete', requireLogin, async (req, res) => {
  const { reportId } = req.params;
  const userId = req.session.user._id;

  try {
    await reportData.deleteUserReport(reportId, userId);
    return res.redirect('/my-activity');
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Error',
      error: typeof e === 'string' ? e : e.message
    });
  }
});

export default router;