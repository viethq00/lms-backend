const {AnswerModel} = require('../models');
const {ANSWER_FIELD} = require('../utils/consts');

module.exports = {
    findAll: async function (findParams) {
        try {
            const answers = await AnswerModel.find(findParams);
            return answers;
        } catch (error) {
            return null;
        }
    },
    create: async function (answerNew) {
        try {
            const answer = await AnswerModel.create(answerNew);
            if (!answer) {
                return null;
            }
            return answer;
        } catch (error) {
            return null;
        }
    },
    findByQuestionIdAndUserId: async function (findParams) {
        const answer = await AnswerModel.findOne(findParams).select(ANSWER_FIELD);
        if (!answer) {
            return null;
        }
        return answer;
    },
    update: async function (id, where) {
        try {
            await AnswerModel.updateOne({_id: id}, {$set: where});
            const answer = await AnswerModel.findOne({_id: id});
            return answer;
        } catch (error) {
            return error;
        }
    },
    deleteMany: async function (ids) {
        try {
            await AnswerModel.deleteMany({_id: {$in: ids}});
        } catch (error) {
            return error;
        }
    },
    count: async function (where) {
        try {
            const count = await AnswerModel.countDocuments(where);
            return count;
        } catch (error) {
            return error;
        }
    },
    deleteManyByUserIds: async function (user_ids) {
        try {
            const answers = await AnswerModel.deleteMany({user_id: {$in: user_ids}});
            return answers;
        } catch (error) {
            return error;
        }
    },
};
