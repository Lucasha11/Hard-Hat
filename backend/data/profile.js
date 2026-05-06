import { users, constructionSites } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import validation from './validation.js';
import reviewData from './reviews.js';

const exportedMethods = {
  // Returns the user document plus their full review history and saved site details.
  async getProfileByUserId(userId) {
    userId = validation.checkId(userId);
    const usersCollection = await users();
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) throw 'Error: User not found';

    // Fetch all reviews written by this user
    const userReviews = await reviewData.getReviewsByUserId(userId);

    // Fetch saved site details (sites the user bookmarked)
    const sitesCollection = await constructionSites();
    let savedSiteDetails = [];
    if (user.savedSites && user.savedSites.length > 0) {
      savedSiteDetails = await sitesCollection
        .find({ _id: { $in: user.savedSites } })
        .toArray();
    }

    return {
      user,
      reviews: userReviews.map((r) => ({
        ...r,
        _id: r._id.toString(),
        userId: r.userId.toString()
      })),
      savedSites: savedSiteDetails.map((s) => ({ ...s, _id: s._id.toString() }))
    };
  },

  // Updates editable profile fields: firstName, lastName, homeBorough.
  async updateProfile(userId, fields) {
    userId = validation.checkId(userId);

    const updateObj = {};

    if (fields.firstName !== undefined) {
      updateObj.firstName = validation.validateName(fields.firstName);
    }
    if (fields.lastName !== undefined) {
      updateObj.lastName = validation.validateName(fields.lastName);
    }
    if (fields.homeBorough !== undefined && fields.homeBorough !== '') {
      updateObj.homeBorough = validation.validateBorough(fields.homeBorough);
    } else if (fields.homeBorough === '') {
      updateObj.homeBorough = null;
    }

    if (Object.keys(updateObj).length === 0) throw 'Error: No valid fields provided to update';

    const usersCollection = await users();
    const updated = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateObj },
      { returnDocument: 'after' }
    );
    if (!updated) throw 'Error: User not found';
    return updated;
  }
};

export default exportedMethods;
