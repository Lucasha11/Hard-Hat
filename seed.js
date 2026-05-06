/**
 * seed.js — inserts one test construction site and one test user for Feature 1 testing.
 * Run once:  node seed.js
 * Re-running is safe (skips inserts if the documents already exist).
 */

import { dbConnection, closeConnection } from './backend/config/mongoConnections.js';
import bcrypt from 'bcryptjs';

const SITE_ID = 'M164-TEST';
const USER_EMAIL = 'tester@hardhat.dev';
const USER_PASSWORD = 'Testing123!';

async function seed() {
  const db = await dbConnection();

  // ── Construction Site ─────────────────────────────────────────────────────
  const sites = db.collection('ConstructionSites');
  const existingSite = await sites.findOne({ _id: SITE_ID });
  if (existingSite) {
    console.log(`Site '${SITE_ID}' already exists — skipping.`);
  } else {
    await sites.insertOne({
      _id: SITE_ID,
      schoolName: 'P.S. 999 — TEST SITE',
      boroughCode: 'M',
      geographicalDistrict: 6,
      projectDescription: 'SCIENCE LAB UPGRADES — SEED DATA FOR TESTING',
      constructionAward: 1480016,
      projectType: 'CIP',
      buildingAddress: '401 WEST 164 STREET',
      city: 'Manhattan',
      postcode: '10033',
      borough: 'MANHATTAN',
      location: { latitude: 40.8357, longitude: -73.9393 },
      communityBoard: 103,
      councilDistrict: 7,
      bin: 1004323,
      bbl: 1003540080,
      nta2020: 'MN2501',
      zipCodes: '10033',
      averageRatings: { noise: 0, airQuality: 0, constructionSize: 0, workHours: 0 },
      reviewCount: 0,
      likeCount: 0,
      source: 'NYC Open Data',
      isApproved: true,
      createdAt: new Date()
    });
    console.log(`Inserted site '${SITE_ID}'.`);
  }

  // ── User ──────────────────────────────────────────────────────────────────
  const USER_USERNAME = 'testerH';
  const users = db.collection('users');
  const existingUser = await users.findOne({ email: USER_EMAIL });
  if (existingUser) {
    if (!existingUser.username) {
      await users.updateOne({ _id: existingUser._id }, { $set: { username: USER_USERNAME } });
      console.log(`User '${USER_EMAIL}' existed without a username — backfilled to '${USER_USERNAME}'.`);
    } else {
      console.log(`User '${USER_EMAIL}' already exists — skipping.`);
    }
    console.log(`  User _id: ${existingUser._id}`);
  } else {
    const hashedPassword = await bcrypt.hash(USER_PASSWORD, 10);
    const result = await users.insertOne({
      firstName: 'Test',
      lastName: 'User',
      email: USER_EMAIL,
      username: USER_USERNAME,
      hashedPassword,
      profileImageUrl: null,
      homeBorough: 'Manhattan',
      savedSites: [],
      reviewIds: [],
      reportIds: [],
      createdAt: new Date()
    });
    console.log(`Inserted user '${USER_EMAIL}'.`);
    console.log(`  User _id: ${result.insertedId}`);
  }

  console.log('\nDone. Use /dev-login to start a session as the test user.');
  await closeConnection();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
