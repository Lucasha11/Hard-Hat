import {ObjectId} from 'mongodb';
import bcrypt from 'bcryptjs';
let saltRounds = 16;



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
    },
    //password must be at least 8 characters long, one uppercase, one number, one special character
    validatePassword(password){
        if (!password || /^\s+$/.test(password)) {
            throw 'Error: Password cannot be empty or consist only of spaces.';
        }
        if (password.length < 8) {
            throw 'Error: Password must be at least 8 characters long.';
        }
        if (!/[A-Z]/.test(password)) {
            throw 'Error: Password must contain at least one uppercase letter.';
        }
        if (!/[0-9]/.test(password)) {
            throw 'Error: Password must contain at least one number.';
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            throw 'Error: Password must contain at least one special character.';
        }
        return password
    },

    async hashPassword(password){
        password = this.validatePassword(password);
        let hash = await bcrypt.hash(password, saltRounds);
        return hash;
    },

    validateName(name) {
        if (!name || typeof name !== 'string') throw 'Error: Name must be a string';
        name = name.trim();
        if (name.length === 0) throw 'Error: Name cannot be empty or only spaces';
        if (/[^a-zA-Z\s\-']/.test(name)) throw 'Error: Name can only contain letters, spaces, hyphens, and apostrophes';
        return name;
    },

    validateEmail(email) {
        if (!email || typeof email !== 'string') throw 'Error: Email must be a string';
        email = email.trim().toLowerCase();
        if (email.length === 0) throw 'Error: Email cannot be empty';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw 'Error: Email is not valid';
        return email;
    },

    validateImage(url) {
        if (!url) return null;
        if (typeof url !== 'string') throw 'Error: Image URL must be a string';
        url = url.trim();
        if (url.length === 0) return null;
        return url;
    },

    validateBorough(borough) {
        if (!borough || typeof borough !== 'string') throw 'Error: Borough must be a string';
        borough = borough.trim();
        const valid = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
        if (!valid.includes(borough)) throw `Error: Borough must be one of: ${valid.join(', ')}`;
        return borough;
    },

    // Allowed: letters, numbers, special characters. No whitespace. Length 3-30.
    validateUsername(username) {
        if (!username || typeof username !== 'string') throw 'Error: Username must be a string';
        username = username.trim();
        if (username.length < 3 || username.length > 30)
            throw 'Error: Username must be between 3 and 30 characters';
        if (/\s/.test(username)) throw 'Error: Username cannot contain spaces';
        if (!/^[!-~]+$/.test(username))
            throw 'Error: Username can only contain letters, numbers, and special characters';
        return username;
    },

    // Construction site Building ID — non-empty trimmed string (e.g., "M164").
    validateSiteId(siteId) {
        if (!siteId || typeof siteId !== 'string') throw 'Error: siteId must be a non-empty string';
        siteId = siteId.trim();
        if (siteId.length === 0) throw 'Error: siteId cannot be empty';
        return siteId;
    }

}

export default exportedMethods;