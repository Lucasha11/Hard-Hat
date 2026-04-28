/*
{
   "_id": objectID,
  "noise": 4,
  "airQuality": 2,
  "constructionSize": 5,
  "workHours": 3
}

**/

import {ratings} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import validation from './validation.js';

let exportedMethods = {
    // return all ratings
    async getAllRatings() {
        const ratingCollection = await ratings();
        return await ratingCollection.find({}).toArray();
    },

    // query rating by id
    async getRatingByID(id) {
        id = validation.checkId(id);
        const ratingCollection = await ratings();
        const rating = await ratingCollection.findOne({_id: new ObjectId(id)});
        if (!rating) throw 'Error: Rating not found';
        return rating;
    },

    // remove one rating by id
    async removeRating(id) {
        id = validation.checkId(id);
        const ratingCollection = await ratings();
        const deletionInfo = await ratingCollection.findOneAndDelete({
            _id: new ObjectId(id)
        });
        if (!deletionInfo) throw `Error: Could not delete rating with id of ${id}`;
        return {...deletionInfo, deleted: true};
    },

    // add a complete set of ratings
    async addAllRatings(noise, airQuality, constructionSize, workHours) {
        noise = validation.validateRating(noise);
        airQuality = validation.validateRating(airQuality);
        constructionSize = validation.validateRating(constructionSize);
        workHours = validation.validateRating(workHours);

        let newRating = {
            noise,
            airQuality,
            constructionSize,
            workHours
        };

        const ratingCollection = await ratings();
        const newInsertInformation = await ratingCollection.insertOne(newRating);
        if (!newInsertInformation.insertedId) throw 'Insert failed!';
        return await this.getRatingByID(newInsertInformation.insertedId.toString());
    },

    async updateNoise(id, noise) {
        id = validation.checkId(id);
        noise = validation.validateRating(noise);

        const ratingCollection = await ratings();
        const updateInfo = await ratingCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: {noise}},
            {returnDocument: 'after'}
        );
        if (!updateInfo) throw 'Error: Update failed';
        return updateInfo;
    },

    async updateAirQuality(id, airQuality) {
        id = validation.checkId(id);
        airQuality = validation.validateRating(airQuality);

        const ratingCollection = await ratings();
        const updateInfo = await ratingCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: {airQuality}},
            {returnDocument: 'after'}
        );
        if (!updateInfo) throw 'Error: Update failed';
        return updateInfo;
    },

    async updateConstructionSize(id, constructionSize) {
        id = validation.checkId(id);
        constructionSize = validation.validateRating(constructionSize);

        const ratingCollection = await ratings();
        const updateInfo = await ratingCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: {constructionSize}},
            {returnDocument: 'after'}
        );
        if (!updateInfo) throw 'Error: Update failed';
        return updateInfo;
    },

    async updateWorkHours(id, workHours) {
        id = validation.checkId(id);
        workHours = validation.validateRating(workHours);

        const ratingCollection = await ratings();
        const updateInfo = await ratingCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: {workHours}},
            {returnDocument: 'after'}
        );
        if (!updateInfo) throw 'Error: Update failed';
        return updateInfo;
    },

    // patch method to update ratings
    async updateRatingsPatch(id, ratingsUpdate) {
        id = validation.checkId(id);
        if (ratingsUpdate.noise)
            ratingsUpdate.noise = validation.validateRating(ratingsUpdate.noise);
        if (ratingsUpdate.airQuality)
            ratingsUpdate.airQuality = validation.validateRating(ratingsUpdate.airQuality);
        if (ratingsUpdate.constructionSize)
            ratingsUpdate.constructionSize = validation.validateRating(ratingsUpdate.constructionSize);
        if (ratingsUpdate.workHours)
            ratingsUpdate.workHours = validation.validateRating(ratingsUpdate.workHours);

        const ratingCollection = await ratings();
        const updateInfo = await ratingCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: ratingsUpdate},
            {returnDocument: 'after'}
        );
        if (!updateInfo)
            throw `Error: Update failed, could not find a rating with id of ${id}`;
        return updateInfo;
    },

    // put method for ratings
    async updateRatingPut(id, ratingsUpdate) {
        id = validation.checkId(id);
        ratingsUpdate.noise = validation.validateRating(ratingsUpdate.noise);
        ratingsUpdate.airQuality = validation.validateRating(ratingsUpdate.airQuality);
        ratingsUpdate.constructionSize = validation.validateRating(ratingsUpdate.constructionSize);
        ratingsUpdate.workHours = validation.validateRating(ratingsUpdate.workHours);

        let updatedRatingData = {
            noise: ratingsUpdate.noise,
            airQuality: ratingsUpdate.airQuality,
            constructionSize: ratingsUpdate.constructionSize,
            workHours: ratingsUpdate.workHours
        };

        const ratingCollection = await ratings();
        const updateInfo = await ratingCollection.findOneAndReplace(
            {_id: new ObjectId(id)},
            updatedRatingData,
            {returnDocument: 'after'}
        );
        if (!updateInfo)
            throw `Error: Update failed! Could not update rating with id ${id}`;
        return updateInfo;
    }
};

export default exportedMethods;
