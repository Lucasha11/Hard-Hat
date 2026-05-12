import { constructionSites, notifications } from "../config/mongoCollections.js";
import validation from './validation.js';
import {ObjectId} from 'mongodb';

const exportedMethods = {
    async createNotification(userId, siteId, message){
        if(!userId || typeof userId !== 'string') throw "Error: userId must be a string";
        siteId = validation.validateSiteId(siteId);
        if(!message || typeof message !== 'string') throw "Error: message must be a string";

        const notificationCollection = await notifications();

        const newNotification = {
            userId,
            siteId,
            message: message.trim(),
            isRead: false,
            createdAt: new Date()
        };
        const insertInfo = await notificationCollection.insertOne(newNotification);
        if(!insertInfo.insertedId) throw "Error: could not create new notification";
        return{ _id: insertInfo.insertedId.toString(), ...newNotification};
    },
    async notifyWatchers(siteId, message, excludeUserId = null) {
        siteId = validation.validateSiteId(siteId);
        if(!message || typeof message !== 'string') throw "Error: message must be a string";

        const sitesCollection = await constructionSites();
        const site = await sitesCollection.findOne({_id: siteId});
        if(!site) throw `Error: site with id ${siteId} not found`;

        const watchers = site.watchers || [];

        const usersToNotify = excludeUserId ? watchers.filter((userId) => userId !== excludeUserId) : watchers;
        for(const userId of usersToNotify) {
            await this.createNotification(userId, siteId, message);
        }
        return {notificationsCreated: usersToNotify.length};
    },
    async getNotificationsByUserId(userId){
        if(!userId || typeof userId !== 'string') throw "Error: userId must be a string";
        const notificationCollection = await notifications();
        return await notificationCollection.find({userId}).sort({createdAt: -1}).toArray();
    },
    async markNotificationAsRead(notificationId, userId){
        notificationId = validation.checkId(notificationId);
        if(!userId || typeof userId !== 'string') throw "Error: userId must be a string";
        const notificationCollection = await notifications();

        const updated = await notificationCollection.findOneAndUpdate(
            {_id: new ObjectId(notificationId), userId},
            {$set:  {isRead: true}},
            {returnDocument: 'after'});
        if(!updated) throw "Error: notification not found";
        return updated;
    }
};
export default exportedMethods;