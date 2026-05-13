import { constructionSites, reviews } from '../config/mongoCollections.js';
import validation from './validation.js';

// NYC Open Data — Active Projects Under Construction
// Dataset: https://data.cityofnewyork.us/Housing-Development/Active-Projects-Under-Construction/8586-3zfm
const NYC_DATASET_URL = 'https://data.cityofnewyork.us/resource/8586-3zfm.json';

// Coerce NYC API string-encoded numbers; null when missing/empty.
function toNumber(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

//filter construction sites

// Hits the city dataset for `buildingid=<siteId>`. Returns the first record, or throws.
async function fetchFromCityDataset(siteId) {
  const url = `${NYC_DATASET_URL}?buildingid=${encodeURIComponent(siteId)}`;
  const res = await fetch(url);
  if (!res.ok) throw `Error: NYC Open Data fetch failed (status ${res.status})`;
  const records = await res.json();
  if (!Array.isArray(records) || records.length === 0)
    throw `Error: No construction site found in NYC Open Data with id '${siteId}'`;
  return records[0];
}

// Maps a raw NYC API record onto the document shape from the database proposal.
function shapeFromCityRecord(rec) {
  return {
    _id: rec.buildingid,
    schoolName: rec.name || null,
    boroughCode: rec.boro || null,
    geographicalDistrict: toNumber(rec.geo_dist),
    projectDescription: rec.projdesc || null,
    constructionAward: toNumber(rec.award),
    projectType: rec.consttype || null,
    buildingAddress: rec.building_address || null,
    city: rec.city || null,
    postcode: rec.zip_code || null,
    borough: rec.borough || null,
    location: {
      latitude: toNumber(rec.latitude),
      longitude: toNumber(rec.longitude)
    },
    communityBoard: toNumber(rec.community_board),
    councilDistrict: toNumber(rec.community_council),
    bin: toNumber(rec.bin),
    bbl: toNumber(rec.bbl),
    nta2020: rec.nta || null,
    zipCodes: rec.zip_code || null,
    averageRatings: { noise: 0, airQuality: 0, constructionSize: 0, workHours: 0 },
    reviewCount: 0,
    likeCount: 0,
    source: 'NYC Open Data',
    isApproved: true,
    watchers: [],
    createdAt: new Date()
  };
}

const exportedMethods = {
  // Validates the siteId against the NYC dataset and returns the raw API record.
  // Throws if the site is not in the city dataset.
  async validateSiteWithCityDataset(siteId) {
    siteId = validation.validateSiteId(siteId);
    return await fetchFromCityDataset(siteId);
  },

  // CREATE — bootstraps a local construction site doc by fetching from NYC Open Data.
  // Throws if the siteId already exists locally OR if it's not in the city dataset.
  async createSite(siteId) {
    siteId = validation.validateSiteId(siteId);

    const sitesCollection = await constructionSites();
    const existing = await sitesCollection.findOne({ _id: siteId });
    if (existing) throw `Error: Construction site '${siteId}' already exists`;

    const cityRecord = await fetchFromCityDataset(siteId);
    const newSite = shapeFromCityRecord(cityRecord);

    const result = await sitesCollection.insertOne(newSite);
    if (!result.insertedId) throw 'Error: Failed to create construction site';
    return await this.getSiteById(siteId);
  },

  // GET — reads the local collection first; on miss, validates against the NYC
  // Open Data dataset and bootstraps a local doc so subsequent reads are cheap
  // and aggregate fields (averageRatings, reviewCount, likeCount) stay coherent.
  // Throws only if the siteId is missing from BOTH sources.
  async getSiteById(siteId) {
    siteId = validation.validateSiteId(siteId);
    const sitesCollection = await constructionSites();

    const local = await sitesCollection.findOne({ _id: siteId });
    if (local) return local;

    let cityRecord;
    try {
      cityRecord = await fetchFromCityDataset(siteId);
    } catch (e) {
      throw `Error: No construction site found with id '${siteId}' in local DB or NYC Open Data`;
    }

    const newSite = shapeFromCityRecord(cityRecord);
    try {
      await sitesCollection.insertOne(newSite);
    } catch (e) {
      // Tolerate a race where a concurrent first-time request inserted first.
      if (!(e && e.code === 11000)) throw e;
    }
    const bootstrapped = await sitesCollection.findOne({ _id: siteId });
    if (!bootstrapped) throw `Error: Failed to bootstrap construction site '${siteId}'`;
    return bootstrapped;
  },

  // PUT — full replace of all editable site fields. Preserves _id, source, createdAt,
  // and aggregate fields (averageRatings, reviewCount, likeCount) that are managed elsewhere.
  async updateSitePut(siteId, siteInfo) {
    siteId = validation.validateSiteId(siteId);
    if (!siteInfo || typeof siteInfo !== 'object') throw 'Error: siteInfo object is required';

    const required = [
      'schoolName', 'boroughCode', 'projectDescription', 'projectType',
      'buildingAddress', 'city', 'postcode', 'borough', 'location'
    ];
    for (const field of required) {
      if (siteInfo[field] === undefined || siteInfo[field] === null || siteInfo[field] === '')
        throw `Error: ${field} is required for full update`;
    }

    if (typeof siteInfo.location !== 'object')
      throw 'Error: location must be a {latitude, longitude} object';
    siteInfo.location.latitude = validation.validateCoordinate(siteInfo.location.latitude);
    siteInfo.location.longitude = validation.validateCoordinate(siteInfo.location.longitude);

    const updateDoc = {
      schoolName: siteInfo.schoolName,
      boroughCode: siteInfo.boroughCode,
      geographicalDistrict: siteInfo.geographicalDistrict ?? null,
      projectDescription: siteInfo.projectDescription,
      constructionAward: siteInfo.constructionAward ?? null,
      projectType: siteInfo.projectType,
      buildingAddress: siteInfo.buildingAddress,
      city: siteInfo.city,
      postcode: siteInfo.postcode,
      borough: siteInfo.borough,
      location: siteInfo.location,
      communityBoard: siteInfo.communityBoard ?? null,
      councilDistrict: siteInfo.councilDistrict ?? null,
      bin: siteInfo.bin ?? null,
      bbl: siteInfo.bbl ?? null,
      nta2020: siteInfo.nta2020 ?? null,
      zipCodes: siteInfo.zipCodes ?? null,
      isApproved: siteInfo.isApproved ?? true
    };

    const sitesCollection = await constructionSites();
    const updated = await sitesCollection.findOneAndUpdate(
      { _id: siteId },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    if (!updated) throw `Error: No construction site found with id '${siteId}'`;
    return updated;
  },

  // Full-text search across site fields and review titles.
  // Returns up to 10 results as { siteId, label, sublabel } objects.
  async searchSites(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0)
      throw 'Error: search query is required';
    query = query.trim();

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const sitesCollection = await constructionSites();
    const reviewsCollection = await reviews();

    const siteDocs = await sitesCollection
      .find({
        $or: [
          { _id: regex },
          { schoolName: regex },
          { buildingAddress: regex },
          { borough: regex },
          { projectDescription: regex }
        ]
      })
      .limit(10)
      .toArray();

    const seen = new Set(siteDocs.map((s) => s._id));

    const matchedReviews = await reviewsCollection
      .find({ title: regex }, { projection: { siteId: 1 } })
      .limit(20)
      .toArray();

    const reviewSiteIds = [...new Set(matchedReviews.map((r) => r.siteId))].filter(
      (id) => !seen.has(id)
    );

    if (reviewSiteIds.length > 0 && siteDocs.length < 10) {
      const extraSites = await sitesCollection
        .find({ _id: { $in: reviewSiteIds } })
        .limit(10 - siteDocs.length)
        .toArray();
      for (const s of extraSites) siteDocs.push(s);
    }

    return siteDocs.slice(0, 10).map((s) => ({
      siteId: s._id,
      label: s.buildingAddress || s.schoolName || s._id,
      sublabel: s.borough || s.projectDescription || null
    }));
  },
  async updateSiteStats(siteId) {
    siteId = validation.validateSiteId(siteId);

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
  },


  // Admin feature: get sites waiting for approval
  async getPendingSites() {
    const sitesCollection = await constructionSites();
    return await sitesCollection.find({ isApproved: false }).toArray();
  },

  // Get all verified/approved construction sites
  async getApprovedSites() {
    const sitesCollection = await constructionSites();
    return await sitesCollection.find({ isApproved: true }).toArray();
  },

  // Admin feature: approve a construction site
  async approveSite(siteId) {
    siteId = validation.validateSiteId(siteId);

    const sitesCollection = await constructionSites();
    const updatedSite = await sitesCollection.findOneAndUpdate(
      { _id: siteId },
      { $set: { isApproved: true } },
      { returnDocument: 'after' }
    );

    if (!updatedSite) throw `Error: Could not approve construction site with id '${siteId}'`;
    return updatedSite;
  },

  // Admin feature: mark a construction site as pending
  async markSitePending(siteId) {
    siteId = validation.validateSiteId(siteId);

    const sitesCollection = await constructionSites();
    const updatedSite = await sitesCollection.findOneAndUpdate(
      { _id: siteId },
      { $set: { isApproved: false } },
      { returnDocument: 'after' }
    );

    if (!updatedSite) throw `Error: Could not mark construction site with id '${siteId}' as pending`;
    return updatedSite;
  },
  async filterSites(filters) {
    const sitesCollection = await constructionSites();

    const query = {};
    if(filters.noise) {
      query["averageRatings.noise"] = {
        $gte: Number(filters.noise)
      };
    }
    if(filters.airQuality) {
      query["averageRatings.airQuality"] = {
        $gte: Number(filters.airQuality)
      };
    }
    if(filters.workHours) {
      query["averageRatings.workHours"] = {
        $gte: Number(filters.workHours)
      };
    }
    return await sitesCollection.find(query).toArray();
  },
  async addWatcher(siteId, userId){
    siteId = validation.validateSiteId(siteId);
    if(!userId || typeof userId !== 'string') throw "Error: userId must be a string";

    const sitesCollection = await constructionSites();
    const updated = await sitesCollection.findOneAndUpdate(
      {_id: siteId},
      {$addToSet: {watchers: userId}},
      {returnDocument: 'after'}
    );
    if(!updated) throw `Error: site with id ${siteId} not found`;
    return updated;
  }
}

export default exportedMethods;