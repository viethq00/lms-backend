const {HistoryUsedTime} = require('../models');

module.exports = {
    findAll: async function (findParams) {
        try {
            const histories = await HistoryUsedTime.find(findParams).select(
                '_id used_time user_id created_at',
            );
            return histories;
        } catch (error) {
            return null;
        }
    },
    create: async function (historyNew) {
        try {
            const history = await HistoryUsedTime.create(historyNew);
            return history;
        } catch (error) {
            return error;
        }
    },
};
