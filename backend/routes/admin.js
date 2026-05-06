import {Router} from 'express';
const router = Router();
import adminData from '../data/admin.js';
import {requireAdmin} from '../middleware/auth.js';

// Feature 6: Admin Panel
// All routes in this file are protected with requireAdmin middleware.

router.get('/', requireAdmin, async (req, res) => {
  try {
    const dashboardData = await adminData.getAdminDashboardData();

    res.render('admin/adminPanel', {
      title: 'Admin Panel',
      pendingSites: dashboardData.pendingSites,
      pendingReports: dashboardData.pendingReports,
      pendingSiteCount: dashboardData.pendingSiteCount,
      pendingReportCount: dashboardData.pendingReportCount,
      hasPendingSites: dashboardData.pendingSiteCount > 0,
      hasPendingReports: dashboardData.pendingReportCount > 0
    });
  } catch (e) {
    res.status(500).render('error', {
      title: 'Error',
      error: e.toString()
    });
  }
});

router.post('/sites/:siteId/approve', requireAdmin, async (req, res) => {  try {
    const updatedSite = await adminData.approveConstructionSite(req.params.siteId);
    res.json(updatedSite);
  } catch (e) {
    res.status(400).json({error: e.toString()});
  }
});

router.post('/sites/:siteId/pending', requireAdmin, async (req, res) => {
  try {
    const updatedSite = await adminData.markConstructionSitePending(req.params.siteId);
    res.json(updatedSite);
  } catch (e) {
    res.status(400).json({error: e.toString()});
  }
});

router.post('/reports/:reportId/approve', requireAdmin, async (req, res) => {
  try {
    const updatedReport = await adminData.approveReport(req.params.reportId);
    res.json(updatedReport);
  } catch (e) {
    res.status(400).json({error: e.toString()});
  }
});

router.post('/reports/:reportId/reject', requireAdmin, async (req, res) => {  try {
    const updatedReport = await adminData.rejectReport(req.params.reportId);
    res.json(updatedReport);
  } catch (e) {
    res.status(400).json({error: e.toString()});
  }
});

export default router;
