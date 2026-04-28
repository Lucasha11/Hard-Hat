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
    async getAllGeoPoints() {
        const geoPointCollection = await geoPoint();
        return await geoPointCollection.find({}).toArray();
    },

    async getGeoPointByID(id) {
        id = validation.checkId(id);
        const geoPointCollection = await geoPoint();
        const geoPointDoc = await geoPointCollection.findOne({_id: new ObjectId(id)});
        if (!geoPointDoc) throw 'Error: GeoPoint not found';
        return geoPointDoc;
    },

    async addGeoPoint(long, lat) {
        long = validation.validateCoordinate(long);
        lat = validation.validateCoordinate(lat);

        let newGeoPoint = {
            longitude: long,
            latitude: lat
        };
        const geoPointCollection = await geoPoint();
        const newInsertInformation = await geoPointCollection.insertOne(newGeoPoint);
        if (!newInsertInformation.insertedId) throw 'Insert failed!';
        return await this.getGeoPointByID(newInsertInformation.insertedId.toString());
    },

    async updateLatitude(id, lat) {
        id = validation.checkId(id);
        lat = validation.validateCoordinate(lat);

        const geoPointCollection = await geoPoint();
        const updateInfo = await geoPointCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: {latitude: lat}},
            {returnDocument: 'after'}
        );
        if (!updateInfo) throw 'Error: Update failed';
        return updateInfo;
    },

    async updateLongitude(id, long) {
        id = validation.checkId(id);
        long = validation.validateCoordinate(long);

        const geoPointCollection = await geoPoint();
        const updateInfo = await geoPointCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: {longitude: long}},
            {returnDocument: 'after'}
        );
        if (!updateInfo) throw 'Error: Update failed';
        return updateInfo;
    },

    async updateCoordsPatch(id, coords) {
        id = validation.checkId(id);
        if (coords.long)
            coords.long = validation.validateCoordinate(coords.long);
        if (coords.lat)
            coords.lat = validation.validateCoordinate(coords.lat);

        const geoPointCollection = await geoPoint();
        const updateInfo = await geoPointCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: coords},
            {returnDocument: 'after'}
        );
        if (!updateInfo)
            throw `Error: Update failed, could not find coordinates with id of ${id}`;
        return updateInfo;
    },

    async updateCoordsPut(id, coords) {
        id = validation.checkId(id);
        coords.long = validation.validateCoordinate(coords.long);
        coords.lat = validation.validateCoordinate(coords.lat);

        let updatedCoordInfo = {
            latitude: coords.lat,
            longitude: coords.long
        };
        const geoPointCollection = await geoPoint();
        const updateInfo = await geoPointCollection.findOneAndReplace(
            {_id: new ObjectId(id)},
            updatedCoordInfo,
            {returnDocument: 'after'}
        );
        if (!updateInfo)
            throw `Error: Update failed, could not find coordinates with id of ${id}`;
        return updateInfo;
    },

    async removeGeoPoint(id) {
        id = validation.checkId(id);
        const geoPointCollection = await geoPoint();
        const deletionInfo = await geoPointCollection.findOneAndDelete({
            _id: new ObjectId(id)
        });
        if (!deletionInfo) throw `Error: Could not delete geoPoint with id of ${id}`;
        return {...deletionInfo, deleted: true};
    }
};

export default exportedMethods;
