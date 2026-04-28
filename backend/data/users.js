import {users} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import validation from './validation.js';


export const usersDataFunctions = {

    async createUser(firstName, lastName, email, username, password, profileImageUrl, homeBorough) {
        if (!firstName || !lastName || !email || !username || !password)
            throw 'Error: firstName, lastName, email, username, and password are required';

        firstName = validation.validateName(firstName);
        lastName = validation.validateName(lastName);
        email = validation.validateEmail(email);
        username = validation.validateUsername(username);
        password = validation.validatePassword(password);
        profileImageUrl = validation.validateImage(profileImageUrl);
        if (homeBorough) homeBorough = validation.validateBorough(homeBorough);

        const userCollection = await users();

        const existing = await userCollection.findOne(
            {username: username},
            {collation: {locale: 'en', strength: 2}}
        );
        if (existing) throw 'Username must be unique.';

        let newUser = {
            firstName,
            lastName,
            email,
            username,
            hashedPassword: password,
            profileImageUrl: profileImageUrl || null,
            homeBorough: homeBorough || null,
            savedSites: [],
            reviewIds: [],
            reportIds: [],
            createdAt: new Date()
        };

        const newInsertInformation = await userCollection.insertOne(newUser);
        if (!newInsertInformation.insertedId) throw 'Insert failed!';
        return await this.getUserById(newInsertInformation.insertedId.toString());
    },

    async getUserById(id) {
        id = validation.checkId(id);
        const userCollection = await users();
        const user = await userCollection.findOne({_id: new ObjectId(id)});
        if (!user) throw 'Error: User not found';
        return user;
    },

    async getUserByEmail(email) {
        const userCollection = await users();
        return await userCollection.findOne({email: email});
    },

    async getUserByUsername(username) {
        username = validation.validateUsername(username);
        const userCollection = await users();
        return await userCollection.findOne(
            {username: username},
            {collation: {locale: 'en', strength: 2}}
        );
    },

    async updateUsername(id, newUsername) {
        id = validation.checkId(id);
        newUsername = validation.validateUsername(newUsername);

        const userCollection = await users();

        const existing = await userCollection.findOne(
            {username: newUsername, _id: {$ne: new ObjectId(id)}},
            {collation: {locale: 'en', strength: 2}}
        );
        if (existing) throw 'Username must be unique.';

        const updated = await userCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: {username: newUsername}},
            {returnDocument: 'after'}
        );
        if (!updated) throw `Error: Update failed, could not find a user with id of ${id}`;

        const reviewData = (await import('./reviews.js')).default;
        await reviewData.updateUsernameOnUserReviews(id, newUsername);

        return updated;
    },

    async updateUserPut(id, userInfo) {
        id = validation.checkId(id);
        if (!userInfo.firstName || !userInfo.lastName || !userInfo.email)
            throw 'Error: firstName, lastName, and email are required for a full update';

        userInfo.firstName = validation.validateName(userInfo.firstName);
        userInfo.lastName = validation.validateName(userInfo.lastName);
        userInfo.email = validation.validateEmail(userInfo.email);
        if (userInfo.profileImageUrl)
            userInfo.profileImageUrl = validation.validateImage(userInfo.profileImageUrl);
        if (userInfo.homeBorough)
            userInfo.homeBorough = validation.validateBorough(userInfo.homeBorough);

        let updatedUser = {
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            email: userInfo.email,
            profileImageUrl: userInfo.profileImageUrl || null,
            homeBorough: userInfo.homeBorough || null
        };

        const userCollection = await users();
        const updateInfo = await userCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: updatedUser},
            {returnDocument: 'after'}
        );
        if (!updateInfo)
            throw `Error: Update failed, could not find a user with id of ${id}`;
        return updateInfo;
    },

    async updateUserPatch(id, userInfo) {
        id = validation.checkId(id);

        if (userInfo.firstName)
            userInfo.firstName = validation.validateName(userInfo.firstName);
        if (userInfo.lastName)
            userInfo.lastName = validation.validateName(userInfo.lastName);
        if (userInfo.email)
            userInfo.email = validation.validateEmail(userInfo.email);
        if (userInfo.hashedPassword)
            userInfo.hashedPassword = validation.validatePassword(userInfo.hashedPassword);
        if (userInfo.homeBorough)
            userInfo.homeBorough = validation.validateBorough(userInfo.homeBorough);

        const userCollection = await users();

        if (userInfo.username) {
            userInfo.username = validation.validateUsername(userInfo.username);
            const dup = await userCollection.findOne(
                {username: userInfo.username, _id: {$ne: new ObjectId(id)}},
                {collation: {locale: 'en', strength: 2}}
            );
            if (dup) throw 'Username must be unique.';
        }

        const updateInfo = await userCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: userInfo},
            {returnDocument: 'after'}
        );
        if (!updateInfo)
            throw `Error: Update failed, could not find a user with id of ${id}`;

        if (userInfo.username) {
            const reviewData = (await import('./reviews.js')).default;
            await reviewData.updateUsernameOnUserReviews(id, userInfo.username);
        }

        return updateInfo;
    },

    async addSavedSite(id, siteId) {
        id = validation.checkId(id);
        if (!siteId || typeof siteId !== 'string') throw 'Error: siteId must be a non-empty string';
        siteId = siteId.trim();
        if (siteId.length === 0) throw 'Error: siteId cannot be empty';

        const userCollection = await users();
        const updateInfo = await userCollection.updateOne(
            {_id: new ObjectId(id)},
            {$addToSet: {savedSites: siteId}}
        );
        if (!updateInfo) throw `Error: could not add ${siteId} to saved sites`;
        return updateInfo;
    },

    async addReviewId(id, reviewId) {
        id = validation.checkId(id);
        reviewId = validation.checkId(reviewId);

        const userCollection = await users();
        await userCollection.updateOne(
            {_id: new ObjectId(id)},
            {$push: {reviewIds: reviewId}}
        );
    },

    async addReportId(id, reportId) {
        id = validation.checkId(id);
        reportId = validation.checkId(reportId);

        const userCollection = await users();
        await userCollection.updateOne(
            {_id: new ObjectId(id)},
            {$push: {reportIds: reportId}}
        );
    }
};
