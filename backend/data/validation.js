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


   


}