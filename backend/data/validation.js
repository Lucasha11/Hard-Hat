import {ObjectId} from 'mongodb';

const exportedMethods = {
    checkId(id) {
        if (!id) throw 'Error: You must provide an id to search for';
        if (typeof id !== 'string') throw 'Error: id must be a string';
        id = id.trim();
        if (id.length === 0)
        throw 'Error: id cannot be an empty string or just spaces';
        if (!ObjectId.isValid(id)) throw 'Error: invalid object ID';
        return id;
    },

   // Ratings should be postiive integer between 1 and 5 inclusive.  
    validateRating(rating){
        if (!rating){
             throw 'Error: Rating must exist';
        }
        
        if (typeof rating !== 'number'){throw "Error: Rating must be a number"}

        if (rating < 1 || rating > 5 ){
            throw "Error: Rating must be between 1 and 5 inclusive"
        }

        return rating
    },

    validateCoordinate(coord){
        if (!coord){
            throw "Error: Coordinate must exist"
        }
        if (typeof coord !== 'number')
            throw "Error: Coordinate must be a number"
        //Coordinate bound by -90 to 90, undusre if it's correct 
        if (coord < -90 || coord > 90)
            throw "Error: Coordinate must be between -90 and 90 degrees"

        return coord 
    }   


   


}