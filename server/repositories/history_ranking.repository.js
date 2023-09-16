const {HistoryRankingModel} = require('../models');

module.exports = {
    findAll: async function (where, pagination) {
        try {
            const list = await HistoryRankingModel.find(where)
                .skip((pagination.page - 1) * pagination.perPage)
                .limit(pagination.perPage)
                .sort('-created_at');
            return list;
        } catch (error) {
            return null;
        }
    },
    findAllHist: async function (where) {
        try {
            const list = await HistoryRankingModel.find(where);
            return list;
        } catch (error) {
            return null;
        }
    },
    findById: async function (id) {
        const hist = await HistoryRankingModel.findOne({_id: id});
        if (!hist) {
            return null;
        }
        return hist;
    },
    findOne: async function (input) {
        const hist = await HistoryRankingModel.findOne(input);
        if (!hist) {
            return null;
        }
        return hist;
    },
    count: async function (where) {
        try {
            const count = await HistoryRankingModel.countDocuments(where);
            return count;
        } catch (error) {
            return error;
        }
    },
    create: async function (input) {
        try {
            const create = await HistoryRankingModel.create(input);
            return create;
        } catch (error) {
            return error;
        }
    },
};
