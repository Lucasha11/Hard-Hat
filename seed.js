import { dbConnection, closeConnection } from './backend/config/mongoConnections.js';
import { usersDataFunctions } from './backend/data/users.js';
import reviewData from './backend/data/reviews.js';
import reviewLikesData from './backend/data/reviewLikes.js';
import reportData from './backend/data/reports.js';

async function seed() {
  const db = await dbConnection();

  // ── 1. Drop collections ───────────────────────────────────────────────────
  console.log('Dropping existing collections...');
  for (const col of ['users', 'reviews', 'ReviewLikes', 'reports', 'ConstructionSites']) {
    await db.collection(col).drop().catch(() => {});
  }

  // ── 2. Users ──────────────────────────────────────────────────────────────
  console.log('Seeding users...');

  const alice = await usersDataFunctions.createUser(
    'Alice', 'Brooks', 'alice@hardhat.dev', 'aliceB', 'Testing123!', null, 'Brooklyn'
  );
  const bob = await usersDataFunctions.createUser(
    'Bob', 'Martinez', 'bob@hardhat.dev', 'bobM', 'Testing123!', null, 'Manhattan'
  );
  const carol = await usersDataFunctions.createUser(
    'Carol', 'Quinn', 'carol@hardhat.dev', 'carolQ', 'Testing123!', null, 'Queens'
  );
  const diana = await usersDataFunctions.createUser(
    'Diana', 'Xavier', 'diana@hardhat.dev', 'dianaX', 'Testing123!', null, 'Bronx'
  );
  const adminUser = await usersDataFunctions.createUser(
    'Admin', 'Hardhat', 'admin@hardhat.dev', 'adminH', 'Testing123!', null, 'Staten Island'
  );

  await db.collection('users').updateOne(
    { _id: adminUser._id },
    { $set: { role: 'admin', isAdmin: true } }
  );

  // ── 3. Construction sites ─────────────────────────────────────────────────
  console.log('Seeding construction sites...');

  const zeroStats = {
    averageRatings: { noise: 0, airQuality: 0, constructionSize: 0, workHours: 0 },
    reviewCount: 0,
    likeCount: 0
  };

  await db.collection('ConstructionSites').insertMany([
    // QA-only sites
    {
      _id: 'BK-QA-001',
      schoolName: 'P.S. 28 — South Brooklyn Renovation',
      boroughCode: 'K',
      geographicalDistrict: 20,
      projectDescription: 'Exterior masonry and window replacement',
      constructionAward: 4200000,
      projectType: 'CIP',
      buildingAddress: '47-49 FT HAMILTON PKWY',
      city: 'Brooklyn',
      postcode: '11209',
      borough: 'BROOKLYN',
      location: { latitude: 40.6328, longitude: -74.0006 },
      communityBoard: 310,
      councilDistrict: 43,
      bin: null, bbl: null, nta2020: 'BK0301', zipCodes: '11209',
      ...zeroStats, source: 'QA Seed', isApproved: true, createdAt: new Date()
    },
    {
      _id: 'MN-QA-002',
      schoolName: '42nd St Midtown Utility Upgrade',
      boroughCode: 'M',
      geographicalDistrict: 2,
      projectDescription: 'Underground utility infrastructure replacement',
      constructionAward: 12500000,
      projectType: 'CAP',
      buildingAddress: '350 W 42ND STREET',
      city: 'Manhattan',
      postcode: '10036',
      borough: 'MANHATTAN',
      location: { latitude: 40.758, longitude: -73.9937 },
      communityBoard: 104,
      councilDistrict: 3,
      bin: null, bbl: null, nta2020: 'MN2501', zipCodes: '10036',
      ...zeroStats, source: 'QA Seed', isApproved: true, createdAt: new Date()
    },
    {
      _id: 'QN-QA-003',
      schoolName: 'Queens Blvd Road Reconstruction',
      boroughCode: 'Q',
      geographicalDistrict: 25,
      projectDescription: 'Full road resurfacing and drainage improvements',
      constructionAward: 3100000,
      projectType: 'CIP',
      buildingAddress: '5600 QUEENS BLVD',
      city: 'Queens',
      postcode: '11373',
      borough: 'QUEENS',
      location: { latitude: 40.736, longitude: -73.8765 },
      communityBoard: 405,
      councilDistrict: 25,
      bin: null, bbl: null, nta2020: 'QN2001', zipCodes: '11373',
      ...zeroStats, source: 'QA Seed', isApproved: true, createdAt: new Date()
    },
    {
      _id: 'BX-QA-004',
      schoolName: 'Bronx Science Wing Addition',
      boroughCode: 'X',
      geographicalDistrict: 10,
      projectDescription: 'New science laboratory wing construction',
      constructionAward: 8750000,
      projectType: 'CAP',
      buildingAddress: '75 W 205TH STREET',
      city: 'Bronx',
      postcode: '10468',
      borough: 'BRONX',
      location: { latitude: 40.8783, longitude: -73.8969 },
      communityBoard: 207,
      councilDistrict: 11,
      bin: null, bbl: null, nta2020: 'BX3201', zipCodes: '10468',
      ...zeroStats, source: 'QA Seed', isApproved: true, createdAt: new Date()
    },
    // NYC Open Data sites (data from cityofnewyork.us/resource/8586-3zfm.json)
    {
      _id: 'K004',
      schoolName: 'I.S. @ 4012 FORT HAMILTON PARKWAY - BROOKLYN',
      boroughCode: 'K',
      geographicalDistrict: 15,
      projectDescription: 'New',
      constructionAward: 66677000,
      projectType: 'CAP',
      buildingAddress: '4012 FORT HAMILTON PARKWAY',
      city: 'Brooklyn',
      postcode: '11218',
      borough: 'BROOKLYN',
      location: { latitude: 40.642578, longitude: -73.991388 },
      communityBoard: 312,
      councilDistrict: 38,
      bin: null, bbl: null, nta2020: 'BK1201', zipCodes: '11218',
      ...zeroStats, source: 'NYC Open Data', isApproved: true, createdAt: new Date()
    },
    {
      _id: 'Q512',
      schoolName: 'P.S. @ 137-23 45 AVENUE - QUEENS',
      boroughCode: 'Q',
      geographicalDistrict: 25,
      projectDescription: 'Demo / New',
      constructionAward: 86036773,
      projectType: 'CAP',
      buildingAddress: '137-23 45 AVENUE',
      city: 'Queens',
      postcode: '11355',
      borough: 'QUEENS',
      location: { latitude: 40.751198, longitude: -73.822473 },
      communityBoard: 407,
      councilDistrict: 20,
      bin: null, bbl: null, nta2020: 'QN0705', zipCodes: '11355',
      ...zeroStats, source: 'NYC Open Data', isApproved: true, createdAt: new Date()
    }
  ]);

  // ── 4. Reviews ────────────────────────────────────────────────────────────
  // createReview() calls updateSiteStats() on every insert, so averageRatings
  // and reviewCount on each site stay accurate throughout seeding.
  console.log('Seeding reviews...');

  // BK-QA-001 — 4 reviews (tests sorting by newest/most-liked, stats math)
  const r1 = await reviewData.createReview(
    'BK-QA-001', alice._id.toString(), alice.username,
    { noise: 4, airQuality: 3, constructionSize: 5, workHours: 4 },
    'Very loud all day',
    'Heavy machinery runs nonstop from 7am. The noise bleeds into nearby apartments and makes it impossible to work from home during peak drilling hours.',
    []
  );
  const r2 = await reviewData.createReview(
    'BK-QA-001', bob._id.toString(), bob.username,
    { noise: 5, airQuality: 2, constructionSize: 4, workHours: 5 },
    'Unbearable dust and noise',
    'The dust is constant and workers are there well into the evening. Air quality on the block has visibly dropped since excavation started.',
    []
  );
  const r3 = await reviewData.createReview(
    'BK-QA-001', carol._id.toString(), carol.username,
    { noise: 3, airQuality: 4, constructionSize: 3, workHours: 3 },
    'Manageable from a block away',
    'I live a block away so maybe I notice less. The crew seems to follow standard hours and the site is fenced off properly.',
    []
  );
  const r4 = await reviewData.createReview(
    'BK-QA-001', diana._id.toString(), diana.username,
    { noise: 2, airQuality: 5, constructionSize: 2, workHours: 2 },
    'Not as bad as expected',
    'Passed by a few times and the work seems limited to a small footprint. Air was fine when I walked by in the afternoon.',
    []
  );

  // MN-QA-002 — 3 reviews (tests inter-user likes, multi-user review listing)
  const r5 = await reviewData.createReview(
    'MN-QA-002', alice._id.toString(), alice.username,
    { noise: 3, airQuality: 3, constructionSize: 4, workHours: 3 },
    'Midtown disruption — as expected',
    'Street closures make the commute painful. Noise is moderate but the footprint of this project affects the whole block.',
    []
  );
  const r6 = await reviewData.createReview(
    'MN-QA-002', bob._id.toString(), bob.username,
    { noise: 4, airQuality: 4, constructionSize: 5, workHours: 4 },
    'Massive operation here',
    'The scale is huge — trucks everywhere by 6am. Somehow air quality has stayed relatively ok given the size of the dig.',
    []
  );
  const r7 = await reviewData.createReview(
    'MN-QA-002', carol._id.toString(), carol.username,
    { noise: 2, airQuality: 2, constructionSize: 2, workHours: 2 },
    'Surprisingly quiet on the weekend',
    'Walked past on a Saturday — barely anything happening. Weekend rules seem to be followed, which is a relief.',
    []
  );

  // QN-QA-003 — 1 review (tests sparse stats dashboard with a single review)
  const r8 = await reviewData.createReview(
    'QN-QA-003', carol._id.toString(), carol.username,
    { noise: 1, airQuality: 1, constructionSize: 1, workHours: 1 },
    'Barely noticeable',
    'Just some resurfacing work. Quick, clean, and minimal disruption to the neighborhood. Wish all construction was like this.',
    []
  );

  // BX-QA-004 — 1 review owned by Diana (tests the delete-review flow)
  const r9 = await reviewData.createReview(
    'BX-QA-004', diana._id.toString(), diana.username,
    { noise: 3, airQuality: 3, constructionSize: 3, workHours: 3 },
    'Standard school construction',
    'Seems on schedule. Fencing is up and workers are courteous. The entrance on 205th is blocked which is annoying but expected.',
    []
  );

  // K004 — 2 reviews (tests stats on a real NYC Open Data site)
  const r10 = await reviewData.createReview(
    'K004', bob._id.toString(), bob.username,
    { noise: 4, airQuality: 3, constructionSize: 5, workHours: 4 },
    'Fort Hamilton — seriously loud',
    'This is a full new building going up. The excavation phase was brutal for the block. Dust coating cars all the way down the street.',
    []
  );
  const r11 = await reviewData.createReview(
    'K004', carol._id.toString(), carol.username,
    { noise: 3, airQuality: 4, constructionSize: 4, workHours: 3 },
    'Big project but crews are responsible',
    'They do stop at 5pm most days and the site is properly fenced. For the size of this build it could be much worse.',
    []
  );

  // ── 4b. Backdate reviews ──────────────────────────────────────────────────
  // createReview() stamps createdAt/updatedAt with new Date(). Patch each
  // review to a distinct date in the May 1–9 2026 testing window.
  const reviewsCol = db.collection('reviews');
  const dates = [
    [r1,  new Date('2026-05-01T09:14:00.000Z')],
    [r2,  new Date('2026-05-02T11:45:00.000Z')],
    [r3,  new Date('2026-05-03T14:22:00.000Z')],
    [r4,  new Date('2026-05-04T08:55:00.000Z')],
    [r5,  new Date('2026-05-02T16:30:00.000Z')],
    [r6,  new Date('2026-05-05T10:10:00.000Z')],
    [r7,  new Date('2026-05-07T13:00:00.000Z')],
    [r8,  new Date('2026-05-06T15:47:00.000Z')],
    [r9,  new Date('2026-05-03T07:38:00.000Z')],
    [r10, new Date('2026-05-08T12:20:00.000Z')],
    [r11, new Date('2026-05-09T09:05:00.000Z')]
  ];
  for (const [review, date] of dates) {
    await reviewsCol.updateOne(
      { _id: review._id },
      { $set: { createdAt: date, updatedAt: date } }
    );
  }

  // ── 5. Review likes ───────────────────────────────────────────────────────
  // All likes are cross-user — no self-likes. toggleLike() keeps likeCount
  // on the review document in sync automatically.
  console.log('Seeding review likes...');

  // r1 (Alice / BK-QA-001) → liked by Bob, Carol, Diana  [likeCount = 3]
  await reviewLikesData.toggleLike(r1._id.toString(), bob._id.toString());
  await reviewLikesData.toggleLike(r1._id.toString(), carol._id.toString());
  await reviewLikesData.toggleLike(r1._id.toString(), diana._id.toString());

  // r2 (Bob / BK-QA-001) → liked by Alice  [likeCount = 1]
  await reviewLikesData.toggleLike(r2._id.toString(), alice._id.toString());

  // r6 (Bob / MN-QA-002) → liked by Alice, Carol  [likeCount = 2]
  await reviewLikesData.toggleLike(r6._id.toString(), alice._id.toString());
  await reviewLikesData.toggleLike(r6._id.toString(), carol._id.toString());

  // r8 (Carol / QN-QA-003) → liked by Bob  [likeCount = 1]
  await reviewLikesData.toggleLike(r8._id.toString(), bob._id.toString());

  // ── 6. Reports ────────────────────────────────────────────────────────────
  console.log('Seeding reports...');

  // Alice: site_update on BK-QA-001 — pending (tests edit/delete own report)
  await reportData.createSiteUpdateReport(
    alice._id.toString(),
    'BK-QA-001',
    'Work is now extending past 6pm on weekdays. The approved permit only covers 7am–5pm. Hours should be reviewed by the city.'
  );

  // Carol: new_site for an unregistered site — pending (tests new site submission flow)
  await reportData.createUserReport(
    carol._id.toString(),
    'QN-UNREG-001',
    'Active construction at the corner of Main St and Sanford Ave in Flushing that is not in the dataset. Heavy equipment arrived two weeks ago with no posted signage.'
  );

  // Bob: site_update on MN-QA-002 — created pending then admin-approved (tests admin panel approved state)
  const bobReport = await reportData.createSiteUpdateReport(
    bob._id.toString(),
    'MN-QA-002',
    'The project description says utility upgrade but structural steel is clearly going up. Scope appears to have expanded significantly.'
  );
  await reportData.updateReportStatus(bobReport._id.toString(), 'approved');

  // Alice: site_update on Q512 (real NYC dataset site) — pending
  await reportData.createSiteUpdateReport(
    alice._id.toString(),
    'Q512',
    'Demolition phase appears complete. New construction framing has started on the north side of the building as of this week.'
  );

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\nSeed complete.\n');
  console.log('Accounts (all passwords: Testing123!)');
  console.log('  alice@hardhat.dev   — regular (Brooklyn)    | 3 reviews, 2 reports');
  console.log('  bob@hardhat.dev     — regular (Manhattan)   | 3 reviews, 1 report (approved)');
  console.log('  carol@hardhat.dev   — regular (Queens)      | 3 reviews, 1 report');
  console.log('  diana@hardhat.dev   — regular (Bronx)       | 2 reviews (BX-QA-004 review is deletable)');
  console.log('  admin@hardhat.dev   — admin (Staten Island) | 0 reviews');
  console.log('\nSites:   BK-QA-001  MN-QA-002  QN-QA-003  BX-QA-004  K004  Q512');
  console.log('Reviews: 11 total across 6 sites');
  console.log('Likes:   7 cross-user like records');
  console.log('Reports: 4 total (1 approved, 3 pending)');

  await closeConnection();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
