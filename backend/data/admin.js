import constructionSiteData from './constructionSites.js';
import reportData from './reports.js';

const exportedMethods = {
  async getAdminDashboardData() {
    const pendingSites = await constructionSiteData.getPendingSites();
    const pendingReports = await reportData.getPendingReports();

    return {
      pendingSites,
      pendingReports,
      pendingSiteCount: pendingSites.length,
      pendingReportCount: pendingReports.length
    };
  },

  async approveConstructionSite(siteId) {
    return await constructionSiteData.approveSite(siteId);
  },

  async markConstructionSitePending(siteId) {
    return await constructionSiteData.markSitePending(siteId);
  },

  async approveReport(reportId) {
    return await reportData.updateReportStatus(reportId, 'approved');
  },

  async rejectReport(reportId) {
    return await reportData.updateReportStatus(reportId, 'rejected');
  }
};

export default exportedMethods;
