/* 

{
  "_id": objectId
  "latitude": 40.673069,
  "longitude": -73.743173
}

**/


import {geoPoint} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import validation from './validation.js';

const exportedMethods = {
    async getAllGeoPoints(){
        const geoPointCollection = await geoPoint();
        return await geoPointCollection.find({}).toArray();
    },
    
    async getRatingByID(id) {
        id = validation.checkId(id);
        const geoPointCollection = await geoPoint();
        const geoPoint = await geoPointCollection.findOne({_id: new ObjectId(id)});
        if (!geoPoint) throw 'Error: User not found';
        return geoPoint;
    },

    async addGeoPoint(long, lat){
        long = validation.validateCoordinate(long)
        lat = validation.validateCoordinate(lat)

        let newGeoPoint = {
            longitude: long,
            latitude: lat
        }
        //complete
        const geoPointCollection = await geoPoint();
        const newInsertInformation = await geoPointCollection.insertOne(newGeoPoint);
        if (!newInsertInformation.insertedId) throw 'Insert failed!';
        return await this.getRatingByID(newInsertInformation.insertedId.toString());

    },

    async updateLatitude(lat){
        lat = validation.validateCoordinate(lat)

        const geoPointCollection = await geoPoint()
        const updateInfo = geoPointCollection.findOneAndUpdate({
        _id: new ObjectId(id)},
        {$set: latitude},
        {returnDocument: 'after'})
        
        if (!updateInfo) throw 'Error: Update failed';

        return await updateInfo;
    },

    async updateLongitude(long){
        long = validation.validateCoordinate(long)

        const geoPointCollection = await geoPoint()
        const updateInfo = geoPointCollection.findOneAndUpdate({
        _id: new ObjectId(id)},
        {$set: longitude},
        {returnDocument: 'after'})
        
        if (!updateInfo) throw 'Error: Update failed';

        return await updateInfo;
    },

    async removeGeoPoint(id) {
        id = validation.checkId(id);
        const geoPointCollection = await geoPoint();
        const deletionInfo = await geoPointCollection.findOneAndDelete({
        _id: new ObjectId(id)
        });
        if (!deletionInfo) throw `Error: Could not delete user with id of ${id}`;

        return {...deletionInfo, deleted: true};
        },
    
}
