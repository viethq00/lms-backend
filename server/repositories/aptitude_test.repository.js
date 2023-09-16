const {AptitudeTestModel} = require('../models');
const {APTITUDE_TEST_FIELD, APTITUDE_TEST_DETAIL_FIELD} = require('../utils/consts');

module.exports = {
    create: async function (newAptitudeTest) {
        const test = await AptitudeTestModel.create(newAptitudeTest);
        if (!test) {
            return null;
        }
        return {
            _id: test.id,
            user_id: test.user_id,
            question_ids: test.question_ids,
            spend_times: test.spend_times,
            score: test.score,
        };
    },
    findById: async function (id) {
        const test = await AptitudeTestModel.findOne({_id: id}).select(APTITUDE_TEST_FIELD);
        if (!test) {
            return null;
        }
        return test;
    },
    update: async function (id, where) {
        try {
            await AptitudeTestModel.updateOne({_id: id}, {$set: where});
            const test = await AptitudeTestModel.findOne({_id: id});
            return test;
        } catch (error) {
            return error;
        }
    },
    findByUserId: async function (userId) {
        const test = await AptitudeTestModel.findOne({
            user_id: userId,
            spend_times: {$ne: null},
            score: {$ne: null},
        })
            .select(APTITUDE_TEST_DETAIL_FIELD)
            .sort({score: -1, spend_times: 1, created_at: -1});
        if (!test) {
            return null;
        }
        return test;
    },
    getAptitudeTests: async function (findParams) {
        try {
            const tests = await AptitudeTestModel.find(findParams)
                .select(APTITUDE_TEST_DETAIL_FIELD)
                .sort('-created_at');
            return tests;
        } catch (error) {
            return null;
        }
    },
    count: async function (where) {
        try {
            const count = await AptitudeTestModel.countDocuments(where);
            return count;
        } catch (error) {
            return error;
        }
    },
    countNew: async function ($match) {
        try {
            return AptitudeTestModel.aggregate([
                {
                    $match
                },
                {
                    $group: {
                        _id: "$user_id",
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]);
        } catch (error) {
            return error;
        }
    },
    deleteManyByUserIds: async function (user_ids) {
        try {
            const tests = await AptitudeTestModel.deleteMany({user_id: {$in: user_ids}});
            return tests;
        } catch (error) {
            return error;
        }
    },
};
