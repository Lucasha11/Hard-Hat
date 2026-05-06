import {reports, users} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import validation from './validation.js';

const checkStatus = (status) => {
  if (!status || typeof status !== 'string') throw 'Error: status must be a string';

  status = status.trim().toLowerCase();
  const validStatuses = ['pending', 'approved', 'rejected'];

  if (!validStatuses.includes(status)) {
    throw 'Error: status must be pending, approved, or rejected';
  }

  return status;
};

const exportedMethods = {
  async getReportById(reportId) {
    reportId = validation.checkId(reportId)
    const reportCollection = await reports();
    const report = await reportCollection.findOne({_id: new ObjectId(reportId)});
    if (!report) throw `Error: No report found with id ${reportId}`;
    return report;
  },

  async getReportsByUserId(userId) {
    userId = validation.checkId(userId)
    const reportCollection = await reports();
    return await reportCollection.find({submittedBy: new ObjectId(userId)}).toArray();
  },

  async getPendingReports() {
    const reportCollection = await reports();
    return await reportCollection.find({status: 'pending'}).toArray();
  },

  async updateReportStatus(reportId, status) {
    reportId = validation.checkId(reportId)
    status = checkStatus(status)

    const reportCollection = await reports();
    const updatedReport = await reportCollection.findOneAndUpdate(
      {_id: new ObjectId(reportId)},
      {$set: {status: status}},
      {returnDocument: 'after'}
    );
    if (!updatedReport) throw `Error: Could not update report with id ${reportId}`;
    return updatedReport;
  },

  async updateUserReport(reportId, userId, updatedData) {
    reportId = validation.checkId(reportId)
    userId = validation.checkId(userId)
    if (!updatedData || typeof updatedData !== 'object' || Array.isArray(updatedData)) {
      throw 'Error: updatedData must be an object';
    }

    delete updatedData._id;
    delete updatedData.submittedBy;
    updatedData.status = 'pending';
    updatedData.updatedAt = new Date();

    const reportCollection = await reports();
    const updatedReport = await reportCollection.findOneAndUpdate(
      {_id: new ObjectId(reportId), submittedBy: new ObjectId(userId)},
      {$set: updatedData},
      {returnDocument: 'after'}
    );
    if (!updatedReport) throw 'Error: Report not found or you do not have permission to edit it';
    return updatedReport;
  },

  async deleteUserReport(reportId, userId) {
    reportId = validation.checkId(reportId)
    userId = validation.checkId(userId)

    const reportCollection = await reports();
    const deletedReport = await reportCollection.findOneAndDelete({
      _id: new ObjectId(reportId),
      submittedBy: new ObjectId(userId)
    });
    if (!deletedReport) throw 'Error: Report not found or you do not have permission to delete it';

    const userCollection = await users();
    await userCollection.updateOne(
      {_id: new ObjectId(userId)},
      {$pull: {reportIds: reportId}}
    );

    return {...deletedReport, deleted: true};
  }
};

export default exportedMethods;
