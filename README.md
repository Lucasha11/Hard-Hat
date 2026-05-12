<<<<<<< HEAD
# Hard Hat
NYC construction site review application — CS 546 Final Project

**Team:** Lucas Ha, Amy Arias Ramirez, Daniel Lenczewski, Joseph Shweky, Leighana Ruiz

---

## Starting the Application

1. Install dependencies:
   ```
   npm install
   ```
2. Start MongoDB:
   ```
   mongod
   ```
3. Seed the database with test data:
   ```
   node seed.js
   ```
4. Start the server:
   ```
   node app.js
   ```
5. Open your browser and navigate to `http://localhost:3000`

---

## Test Accounts

All accounts use the password: **`Testing123!`**

| Email | Username | Role | Borough |
|---|---|---|---|
| alice@hardhat.dev | aliceB | Regular | Brooklyn |
| bob@hardhat.dev | bobM | Regular | Manhattan |
| carol@hardhat.dev | carolQ | Regular | Queens |
| diana@hardhat.dev | dianaX | Regular | Bronx |
| admin@hardhat.dev | adminH | **Admin** | Staten Island |

---

## Seeded Data

### Construction Sites (6)

| Site ID | Name | Borough | Source |
|---|---|---|---|
| BK-QA-001 | P.S. 28 — South Brooklyn Renovation | Brooklyn | QA Seed |
| MN-QA-002 | 42nd St Midtown Utility Upgrade | Manhattan | QA Seed |
| QN-QA-003 | Queens Blvd Road Reconstruction | Queens | QA Seed |
| BX-QA-004 | Bronx Science Wing Addition | Bronx | QA Seed |
| K004 | I.S. @ 4012 Fort Hamilton Pkwy | Brooklyn | NYC Open Data |
| Q512 | P.S. @ 137-23 45 Ave | Queens | NYC Open Data |

### Reviews (11)

| Site | Author | Purpose |
|---|---|---|
| BK-QA-001 | Alice, Bob, Carol, Diana | Multi-user review list; sort by newest / most liked |
| MN-QA-002 | Alice, Bob, Carol | Inter-user like interactions |
| QN-QA-003 | Carol | Sparse stats dashboard (single review) |
| BX-QA-004 | Diana | Delete-review flow — Diana owns this review |
| K004 | Bob, Carol | Stats on a real NYC Open Data site |

### Review Likes (7 records)

| Review | Liked By | Like Count |
|---|---|---|
| Alice's BK-QA-001 review | Bob, Carol, Diana | 3 |
| Bob's BK-QA-001 review | Alice | 1 |
| Bob's MN-QA-002 review | Alice, Carol | 2 |
| Carol's QN-QA-003 review | Bob | 1 |

### Reports (4)

| Author | Type | Site | Status |
|---|---|---|---|
| Alice | Site update | BK-QA-001 | Pending |
| Carol | New site | QN-UNREG-001 | Pending |
| Bob | Site update | MN-QA-002 | **Approved** |
| Alice | Site update | Q512 | Pending |

---

## Re-seeding

Running `node seed.js` again drops and rebuilds all collections from scratch. Any data created during manual testing will be lost.
=======
# CS-546WS-Final-Project
Construction site review app


# To Run the Application
1. Run **npm install** in terminal
2. Run **mongod** in terminal to start mongodb database
3. Run **node app.js** in terminal
4. Navigate to _localhost:3000_ in browser
>>>>>>> features8and10
