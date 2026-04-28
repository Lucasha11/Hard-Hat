import { constructionSites, reviews } from '../config/mongoCollections.js';

const exportedMethods = {
  async getSiteById(siteId) {
    if (!siteId || typeof siteId !== 'string') throw 'Error: siteId must be a non-empty string';
    siteId = siteId.trim();
    if (siteId.length === 0) throw 'Error: siteId cannot be empty';

    const sitesCollection = await constructionSites();
    const site = await sitesCollection.findOne({ _id: siteId });
    if (!site) throw `Error: No construction site found with id '${siteId}'`;
    return site;
  },

  // Recomputes averageRatings and reviewCount from the live reviews collection
  async updateSiteStats(siteId) {
    if (!siteId || typeof siteId !== 'string') return;

    const reviewsCollection = await reviews();
    const allReviews = await reviewsCollection.find({ siteId }).toArray();
    const count = allReviews.length;

    let avgRatings = { noise: 0, airQuality: 0, constructionSize: 0, workHours: 0 };
    if (count > 0) {
      const round1 = (n) => Math.round(n * 10) / 10;
      avgRatings = {
        noise: round1(allReviews.reduce((s, r) => s + r.ratings.noise, 0) / count),
        airQuality: round1(allReviews.reduce((s, r) => s + r.ratings.airQuality, 0) / count),
        constructionSize: round1(
          allReviews.reduce((s, r) => s + r.ratings.constructionSize, 0) / count
        ),
        workHours: round1(allReviews.reduce((s, r) => s + r.ratings.workHours, 0) / count)
      };
    }

    const sitesCollection = await constructionSites();
    await sitesCollection.findOneAndUpdate(
      { _id: siteId },
      { $set: { averageRatings: avgRatings, reviewCount: count } }
    );
  }
};

export default exportedMethods;
