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
    
    async getRatingByID(id) {
        id = validation.checkId(id);
        const ratingCollection = await ratings();
        const rating = await ratingCollection.findOne({_id: new ObjectId(id)});
        if (!rating) throw 'Error: User not found';
        return rating;
    },

    async removeRating(id) {
        id = validation.checkId(id);
        const ratingCollection = await ratings();
        const deletionInfo = await ratingCollection.findOneAndDelete({
        _id: new ObjectId(id)
        });
        if (!deletionInfo) throw `Error: Could not delete user with id of ${id}`;

    return {...deletionInfo, deleted: true};
    },
    
    async addAllRatings(noiseRating, airQuality, constructionSize, workHours){
        noiseRating = validation.validateeRating(noiseRating)
        airQuality = validation.validateeRating(airQuality)
        constructionSize = validation.validateeRating(constructionSize)
        workHours = validation.validateeRating(workHours)

        let newRating = {
            noiseRating,
            airQuality,
            constructionSize,
            workHours
        }

        const ratingCollection = await ratings();
        const newInsertInformation = await ratingCollection.insertOne(newRating);
        if (!newInsertInformation.insertedId) throw 'Insert failed!';
        return await this.getRatingByID(newInsertInformation.insertedId.toString());

    },  
    async updateNoise(id, noiseRating){
        id = validation.checkId(id);
        noiseRating = validation.validateeRating(noiseRating)

        const updatedNoise = { noiseRating}

        const ratingCollection = await ratings()
        const updateInfo = ratingCollection.findOneAndUpdate({
        _id: new ObjectId(id)},
        {$set: updatedNoise},
        {returnDocument: 'after'})
        
       if (!updateInfo) throw 'Error: Update failed';

        return await updateInfo;

    },

   async updateAirQuality(id, airQuality){
        id = validation.checkId(id);
        airQuality = validation.validateeRating(airQuality)

        const updatedAirQuality = { airQuality}

        const ratingCollection = await ratings()
        const updateInfo = ratingCollection.findOneAndUpdate({
        _id: new ObjectId(id)},
        {$set: updatedAirQuality},
        {returnDocument: 'after'})
        
       if (!updateInfo) throw 'Error: Update failed';

        return await updateInfo;

    },

    async updateConstructionSize(id, constructionSize){
        id = validation.checkId(id);
        constructionSize = validation.validateeRating(noiseRating)

        const updateConstructionSize = { constructionSize}

        const ratingCollection = await ratings()
        const updateInfo = ratingCollection.findOneAndUpdate({
        _id: new ObjectId(id)},
        {$set: updateConstructionSize},
        {returnDocument: 'after'})
        
       if (!updateInfo) throw 'Error: Update failed';

        return await updateInfo;

    },

    async updateWorkHours(id, workHours){
        id = validation.checkId(id);
        workHours = validation.validateeRating(workHours)

        const updatedWorkHours = { workHours}

        const ratingCollection = await ratings()
        const updateInfo = ratingCollection.findOneAndUpdate({
        _id: new ObjectId(id)},
        {$set: updatedWorkHours},
        {returnDocument: 'after'})
        
       if (!updateInfo) throw 'Error: Update failed';

        return await updateInfo;
    },
}

export default exportedMethods;
