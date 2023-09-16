const {StatisticModel} = require('../models');
const {STATISTIC_FIELD} = require('../utils/consts');

module.exports = {
    create: async function (newStatistic) {
        const statistic = await StatisticModel.create(newStatistic);
        if (!statistic) {
            return null;
        }
        return {
            _id: statistic.id,
            child_type_A: statistic.child_type_A,
            child_type_B: statistic.child_type_B,
            child_type_C: statistic.child_type_C,
            child_type_D: statistic.child_type_D,
            child_type_E: statistic.child_type_E,
            child_type_F: statistic.child_type_F,
            created_at: statistic.created_at,
            updated_at: statistic.updated_at,
        };
    },
    findByUserId: async function (userId) {
        const statistic = await StatisticModel.findOne({user_id: userId}).select(STATISTIC_FIELD);
        if (!statistic) {
            return null;
        }
        return statistic;
    },
    findByUserIdsNew: async function (userIds) {
        return StatisticModel.find({user_id: {$in: userIds}}).select(STATISTIC_FIELD);
    },
    update: async function (id, where) {
        try {
            await StatisticModel.updateOne({_id: id}, {$set: where});
            const statistic = await StatisticModel.findOne({_id: id});
            return statistic;
        } catch (error) {
            return error;
        }
    },
    deleteManyByUserIds: async function (user_ids) {
        try {
            const statistics = await StatisticModel.deleteMany({user_id: {$in: user_ids}});
            return statistics;
        } catch (error) {
            return error;
        }
    },
    count: async function (where) {
        try {
            const count = await StatisticModel.countDocuments(where);
            return count;
        } catch (error) {
            return error;
        }
    },
};
