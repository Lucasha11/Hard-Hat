/**
 * {
  "_id": "67f2db1b6d3a1247b6233001",
  "siteId": "M164",
  "userId": "67f2d89f6d3a1247b6231001",
  "username": "leighanaR",
  "ratings": {
    "noise": 5,
    "airQuality": 2,
    "constructionSize": 4,
    "workHours": 3
  },
  "title": "Very loud during the morning",
  "body": "Heavy drilling starts before lunch and the sidewalk feels crowded.",
  "photoUrls": ["/public/uploads/reviews/rev1-1.jpg"],
  "likeCount": 8,
  "createdAt": "2026-04-01T11:35:00.000Z",
  "updatedAt": "2026-04-01T11:35:00.000Z"
}
 */

import { reviews, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import validation from './validation.js';
import siteData from './constructionSites.js';

const exportedMethods = {
  async createReview(siteId, userId, username, ratings, title, body, photoUrls = []) {
    //  validate inputs 
    if (!siteId || typeof siteId !== 'string' || siteId.trim().length === 0)
      throw 'Error: siteId is required';
    siteId = siteId.trim();

    userId = validation.checkId(userId);

    username = validation.validateUsername(username);

    if (!ratings || typeof ratings !== 'object')
      throw 'Error: ratings object is required';
    ratings = {
      noise: validation.validateRating(ratings.noise),
      airQuality: validation.validateRating(ratings.airQuality),
      constructionSize: validation.validateRating(ratings.constructionSize),
      workHours: validation.validateRating(ratings.workHours)
    };

    if (!title || typeof title !== 'string' || title.trim().length === 0)
      throw 'Error: title is required';
    title = title.trim();
    if (title.length > 100) throw 'Error: title cannot exceed 100 characters';

    if (!body || typeof body !== 'string' || body.trim().length === 0)
      throw 'Error: review text is required';
    body = body.trim();
    if (body.length > 2000) throw 'Error: review text cannot exceed 2000 characters';

    if (!Array.isArray(photoUrls)) photoUrls = [];

    // Validate the siteId against the NYC Open Data dataset and bootstrap
    // a local construction site doc if one doesn't exist yet.
    try {
      await siteData.getSiteById(siteId);
    } catch (e) {
      await siteData.createSite(siteId);
    }

    const newReview = {
      siteId,
      userId: new ObjectId(userId),
      username,
      ratings,
      title,
      body,
      photoUrls,
      likeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const reviewsCollection = await reviews();
    const insertResult = await reviewsCollection.insertOne(newReview);
    if (!insertResult.insertedId) throw 'Error: Failed to create review';

    const reviewId = insertResult.insertedId.toString();

    // Link the review to the user
    const usersCollection = await users();
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $push: { reviewIds: reviewId } }
    );

    // Keep site aggregate stats current
    await siteData.updateSiteStats(siteId);

    return await this.getReviewById(reviewId);
  },

  async getReviewById(id) {
    id = validation.checkId(id);
    const reviewsCollection = await reviews();
    const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
    if (!review) throw `Error: No review found with id '${id}'`;
    return review;
  },

  async getReviewsBySiteId(siteId, sortBy = 'newest') {
    if (!siteId || typeof siteId !== 'string') throw 'Error: siteId is required';
    siteId = siteId.trim();

    const reviewsCollection = await reviews();
    const sortOption = sortBy === 'most_liked' ? { likeCount: -1 } : { createdAt: -1 };
    return await reviewsCollection.find({ siteId }).sort(sortOption).toArray();
  },

  async getReviewsByUserId(userId) {
    userId = validation.checkId(userId);
    const reviewsCollection = await reviews();
    return await reviewsCollection
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
  },

  async updateReview(reviewId, userId, updatedFields) {
    reviewId = validation.checkId(reviewId);
    userId = validation.checkId(userId);

    const reviewsCollection = await reviews();
    const existing = await reviewsCollection.findOne({ _id: new ObjectId(reviewId) });
    if (!existing) throw `Error: No review found with id '${reviewId}'`;
    if (existing.userId.toString() !== userId)
      throw 'Error: You can only edit your own reviews';

    const updateObj = {};

    if (updatedFields.title !== undefined) {
      const t = updatedFields.title.trim();
      if (t.length === 0) throw 'Error: title cannot be empty';
      if (t.length > 100) throw 'Error: title cannot exceed 100 characters';
      updateObj.title = t;
    }

    if (updatedFields.body !== undefined) {
      const b = updatedFields.body.trim();
      if (b.length === 0) throw 'Error: review text cannot be empty';
      if (b.length > 2000) throw 'Error: review text cannot exceed 2000 characters';
      updateObj.body = b;
    }

    if (updatedFields.ratings) {
      const r = updatedFields.ratings;
      updateObj.ratings = {
        noise: validation.validateRating(r.noise),
        airQuality: validation.validateRating(r.airQuality),
        constructionSize: validation.validateRating(r.constructionSize),
        workHours: validation.validateRating(r.workHours)
      };
    }

    if (updatedFields.photoUrls !== undefined) {
      updateObj.photoUrls = Array.isArray(updatedFields.photoUrls)
        ? updatedFields.photoUrls
        : [];
    }

    updateObj.updatedAt = new Date();

    const updated = await reviewsCollection.findOneAndUpdate(
      { _id: new ObjectId(reviewId) },
      { $set: updateObj },
      { returnDocument: 'after' }
    );
    if (!updated) throw `Error: Failed to update review with id '${reviewId}'`;

    await siteData.updateSiteStats(existing.siteId);

    return updated;
  },

  async updateUsernameOnUserReviews(userId, newUsername) {
    userId = validation.checkId(userId);
    newUsername = validation.validateUsername(newUsername);
    const reviewsCollection = await reviews();
    await reviewsCollection.updateMany(
      { userId: new ObjectId(userId) },
      { $set: { username: newUsername } }
    );
  },

  async deleteReview(reviewId, userId) {
    reviewId = validation.checkId(reviewId);
    userId = validation.checkId(userId);

    const reviewsCollection = await reviews();
    const existing = await reviewsCollection.findOne({ _id: new ObjectId(reviewId) });
    if (!existing) throw `Error: No review found with id '${reviewId}'`;
    if (existing.userId.toString() !== userId)
      throw 'Error: You can only delete your own reviews';

    const siteId = existing.siteId;

    const deleted = await reviewsCollection.findOneAndDelete({ _id: new ObjectId(reviewId) });
    if (!deleted) throw `Error: Failed to delete review with id '${reviewId}'`;

    // Remove the review reference from the user document
    const usersCollection = await users();
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { reviewIds: reviewId } }
    );

    await siteData.updateSiteStats(siteId);

    return { deleted: true };
  }
};

export default exportedMethods;
