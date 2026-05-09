import { reviewLikes, reviews } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import validation from './validation.js';

const exportedMethods = {
  async toggleLike(reviewId, userId) {
    reviewId = validation.checkId(reviewId);
    userId = validation.checkId(userId);

    const likesCollection = await reviewLikes();
    const reviewsCollection = await reviews();

    const existingLike = await likesCollection.findOne({
      reviewId: new ObjectId(reviewId),
      userId: new ObjectId(userId)
    });

    let likeCountChange;
    if (existingLike) {
      await likesCollection.deleteOne({ _id: existingLike._id });
      likeCountChange = -1;
    } else {
      await likesCollection.insertOne({
        reviewId: new ObjectId(reviewId),
        userId: new ObjectId(userId),
        createdAt: new Date()
      });
      likeCountChange = 1;
    }

    const updatedReview = await reviewsCollection.findOneAndUpdate(
      { _id: new ObjectId(reviewId) },
      { $inc: { likeCount: likeCountChange } },
      { returnDocument: 'after' }
    );
    if (!updatedReview) throw `Error: Review not found with id '${reviewId}'`;

    return {
      liked: likeCountChange === 1,
      likeCount: updatedReview.likeCount
    };
  },

  async getLikedReviewIds(userId, reviewIds) {
    if (!userId || !Array.isArray(reviewIds) || reviewIds.length === 0) return new Set();
    userId = validation.checkId(userId);

    const likesCollection = await reviewLikes();
    const reviewObjectIds = reviewIds.map((id) => new ObjectId(id));

    const userLikes = await likesCollection
      .find({ userId: new ObjectId(userId), reviewId: { $in: reviewObjectIds } })
      .project({ reviewId: 1 })
      .toArray();

    return new Set(userLikes.map((like) => like.reviewId.toString()));
  }
};

export default exportedMethods;