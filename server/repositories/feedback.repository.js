const {FeedbackModel} = require('../models');
const {FEEDBACK_FIELD, USER_STATUS, USER_ROLES, IS_DELETED} = require('../utils/consts');

module.exports = {
    create: async function (feedbackNew) {
        try {
            const feedback = await FeedbackModel.create(feedbackNew);
            if (!feedback) {
                return null;
            }
            return feedback;
        } catch (error) {
            return null;
        }
    },
    count: async function () {
        try {
            const count = await FeedbackModel.countDocuments({is_deleted: IS_DELETED.NOT_DELETED});
            return count;
        } catch (error) {
            return error;
        }
    },
    findAll: async function (param, pagination) {
        try {
            const feedbacks = await FeedbackModel.find({is_deleted: IS_DELETED.NOT_DELETED})
                .populate({
                    path: 'user_id',
                    match: {status: USER_STATUS.ACTIVE, role: USER_ROLES.USER},
                    select: '_id full_name email username role personal_id status',
                })
                .select(FEEDBACK_FIELD)
                .skip((pagination.page - 1) * pagination.perPage)
                .limit(pagination.perPage)
                .sort(param);
            return feedbacks;
        } catch (error) {
            return null;
        }
    },
    findById: async function (id) {
        const feedback = await FeedbackModel.findOne({_id: id})
            .populate({
                path: 'user_id',
                select: '_id full_name email username role personal_id status',
            })
            .select(FEEDBACK_FIELD);
        if (!feedback) {
            return null;
        }
        return feedback;
    },
    update: async function (id, where) {
        try {
            await FeedbackModel.updateOne({_id: id}, {$set: where});
            const feedback = await FeedbackModel.findOne({_id: id});
            return feedback;
        } catch (error) {
            return error;
        }
    },
    deleteMany: async function (ids) {
        try {
            const feedbacks = await FeedbackModel.updateMany(
                {_id: {$in: ids}, is_deleted: {$ne: IS_DELETED.DELETED}},
                {is_deleted: IS_DELETED.DELETED},
                {new: true},
            );
            return feedbacks;
        } catch (error) {
            return error;
        }
    },
    deleteManyByUserIds: async function (user_ids) {
        try {
            const feedbacks = await FeedbackModel.updateMany(
                {user_id: {$in: user_ids}, is_deleted: {$ne: IS_DELETED.DELETED}},
                {is_deleted: IS_DELETED.DELETED},
                {new: true},
            );
            return feedbacks;
        } catch (error) {
            return error;
        }
    },
    findAllWithArrayIds: async function (ids) {
        try {
            const feedbacks = await FeedbackModel.find({_id: {$in: ids}});
            return feedbacks;
        } catch (error) {
            return error;
        }
    },
};
