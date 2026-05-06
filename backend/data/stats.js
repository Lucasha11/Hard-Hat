import { constructionSites, reviews } from '../config/mongoCollections.js';

const exportedMethods = {
  // Returns high-level counts and averages across the entire database.
  async getOverallStats() {
    const sitesCollection = await constructionSites();
    const reviewsCollection = await reviews();

    const [totalSites, totalReviews] = await Promise.all([
      sitesCollection.countDocuments({}),
      reviewsCollection.countDocuments({})
    ]);

    // Average of all per-review ratings
    const ratingAgg = await reviewsCollection
      .aggregate([
        {
          $group: {
            _id: null,
            noise: { $avg: '$ratings.noise' },
            airQuality: { $avg: '$ratings.airQuality' },
            constructionSize: { $avg: '$ratings.constructionSize' },
            workHours: { $avg: '$ratings.workHours' }
          }
        }
      ])
      .toArray();

    const round1 = (n) => (n != null ? Math.round(n * 10) / 10 : 0);
    const overallRatings =
      ratingAgg.length > 0
        ? {
            noise: round1(ratingAgg[0].noise),
            airQuality: round1(ratingAgg[0].airQuality),
            constructionSize: round1(ratingAgg[0].constructionSize),
            workHours: round1(ratingAgg[0].workHours)
          }
        : { noise: 0, airQuality: 0, constructionSize: 0, workHours: 0 };

    return { totalSites, totalReviews, overallRatings };
  },

  // Returns review count and average ratings broken down by borough.
  async getStatsByBorough() {
    const reviewsCollection = await reviews();
    const sitesCollection = await constructionSites();

    // Map siteId -> borough from local DB
    const siteDocs = await sitesCollection
      .find({}, { projection: { _id: 1, borough: 1 } })
      .toArray();
    const boroughMap = {};
    for (const s of siteDocs) {
      if (s.borough) boroughMap[s._id] = s.borough;
    }

    const allReviews = await reviewsCollection.find({}).toArray();

    const byBorough = {};
    for (const r of allReviews) {
      const borough = boroughMap[r.siteId] || 'Unknown';
      if (!byBorough[borough]) {
        byBorough[borough] = {
          borough,
          reviewCount: 0,
          noise: 0,
          airQuality: 0,
          constructionSize: 0,
          workHours: 0
        };
      }
      const b = byBorough[borough];
      b.reviewCount++;
      b.noise += r.ratings.noise;
      b.airQuality += r.ratings.airQuality;
      b.constructionSize += r.ratings.constructionSize;
      b.workHours += r.ratings.workHours;
    }

    const round1 = (n) => Math.round(n * 10) / 10;

    return Object.values(byBorough)
      .map((b) => ({
        borough: b.borough,
        reviewCount: b.reviewCount,
        avgNoise: round1(b.noise / b.reviewCount),
        avgAirQuality: round1(b.airQuality / b.reviewCount),
        avgConstructionSize: round1(b.constructionSize / b.reviewCount),
        avgWorkHours: round1(b.workHours / b.reviewCount)
      }))
      .sort((a, b) => b.reviewCount - a.reviewCount);
  },

  // Returns the top N most-reviewed sites.
  async getTopReviewedSites(limit = 5) {
    const sitesCollection = await constructionSites();
    return await sitesCollection
      .find({ reviewCount: { $gt: 0 } })
      .sort({ reviewCount: -1 })
      .limit(limit)
      .toArray();
  },

  // Returns the top N highest-rated sites (average of all 4 rating categories),
  // requiring at least minReviews reviews so single-review outliers don't dominate.
  async getTopRatedSites(limit = 5, minReviews = 1) {
    const sitesCollection = await constructionSites();
    const sites = await sitesCollection
      .find({ reviewCount: { $gte: minReviews } })
      .toArray();

    const round2 = (n) => Math.round(n * 100) / 100;

    return sites
      .map((s) => {
        const r = s.averageRatings || {};
        const overall = round2(
          ((r.noise || 0) + (r.airQuality || 0) + (r.constructionSize || 0) + (r.workHours || 0)) /
            4
        );
        return { ...s, overallRating: overall };
      })
      .sort((a, b) => b.overallRating - a.overallRating)
      .slice(0, limit);
  },

  // Returns the most recent N reviews with site info joined in.
  async getRecentReviewsWithSite(limit = 5) {
    const reviewsCollection = await reviews();
    const sitesCollection = await constructionSites();

    const recentReviews = await reviewsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return Promise.all(
      recentReviews.map(async (r) => {
        try {
          const site = await sitesCollection.findOne({ _id: r.siteId });
          return {
            ...r,
            _id: r._id.toString(),
            userId: r.userId.toString(),
            schoolName: site?.schoolName || r.siteId,
            buildingAddress: site?.buildingAddress || '',
            borough: site?.borough || ''
          };
        } catch {
          return { ...r, _id: r._id.toString(), userId: r.userId.toString() };
        }
      })
    );
  }
};

export default exportedMethods;
