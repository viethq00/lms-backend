const {ReceiverFeedbackModel} = require('../models');

module.exports = {
    findByEmail: async function (email) {
        const user = await ReceiverFeedbackModel.findOne({email: email});
        if (!user) {
            return null;
        }
        return user;
    },
    findOne: async function (findParams) {
        const user = await ReceiverFeedbackModel.findOne(findParams);
        if (!user) {
            return null;
        }
        return user;
    },
    findById: async function (id) {
        const user = await ReceiverFeedbackModel.findOne({_id: id});
        if (!user) {
            return null;
        }
        return user;
    },
    findAll: async function (findParams, pagination) {
        try {
            const user = await ReceiverFeedbackModel.find(findParams)
                .skip((pagination.page - 1) * pagination.perPage)
                .limit(pagination.perPage)
                .sort('-created_at');
            return user;
        } catch (error) {
            return null;
        }
    },
    findAllUser: async function (findParams) {
        try {
            const user = await ReceiverFeedbackModel.find(findParams);
            return user;
        } catch (error) {
            return null;
        }
    },
    create: async function (newAcc) {
        return new Promise((resolve, reject) => {
            ReceiverFeedbackModel.create(newAcc, (err, result) => {
                if (err) {
                    return reject(null);
                }
                return resolve(result);
            });
        });
    },
    count: async function (where) {
        try {
            const count = await ReceiverFeedbackModel.countDocuments(where);
            return count;
        } catch (error) {
            return error;
        }
    },
    update: async function (id, where) {
        try {
            await ReceiverFeedbackModel.updateOne({_id: id}, {$set: where});
            const user = await ReceiverFeedbackModel.findOne({_id: id});
            return user;
        } catch (error) {
            return error;
        }
    },
    delete: async function (id) {
        try {
            const user = await ReceiverFeedbackModel.deleteOne({_id: id});
            return user;
        } catch (error) {
            return error;
        }
    },
};
