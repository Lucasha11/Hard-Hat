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

  // GET — strict read from the local collection.
  async getSiteById(siteId) {
    siteId = validation.validateSiteId(siteId);
    const sitesCollection = await constructionSites();
    const site = await sitesCollection.findOne({ _id: siteId });
    if (!site) throw `Error: No construction site found with id '${siteId}'`;
    return site;
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

  // Recomputes averageRatings and reviewCount from the live reviews collection.
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
  }
};

export default exportedMethods;
