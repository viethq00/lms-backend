const {TestModel} = require('../models');
const {TEST_FIELD} = require('../utils/consts');

module.exports = {
    create: async function (newTest) {
        const test = await TestModel.create(newTest);
        if (!test) {
            return null;
        }
        return {
            _id: test.id,
            user_id: test.user_id,
            question_ids: test.question_ids,
            root_type: test.root_type,
        };
    },
    update: async function (id, where) {
        try {
            await TestModel.updateOne({_id: id}, {$set: where});
            const test = await TestModel.findOne({_id: id});
            return test;
        } catch (error) {
            return error;
        }
    },
    findById: async function (id) {
        const test = await TestModel.findOne({_id: id}).select(TEST_FIELD);
        if (!test) {
            return null;
        }
        return test;
    },
    getTest: async function (findParams) {
        const test = await TestModel.findOne(findParams).select(TEST_FIELD).sort({created_at: -1});
        if (!test) {
            return null;
        }
        return test;
    },
    getTestNew: async function (findParams) {
        // return TestModel.findOne(findParams).select(TEST_FIELD).sort({created_at: -1});;
        return TestModel.aggregate([
            {$match: findParams},
            {
                $group:{
                    '_id': '$user_id'
                }
            }
        ]);
    },
    count: async function (where) {
        try {
            const count = await TestModel.countDocuments(where);
            return count;
        } catch (error) {
            return error;
        }
    },
    countByUserIdsAndRootType: async function ($match) {
        try {
            return  TestModel.aggregate([
                {
                    $match
                },
                {
                    $lookup: {
                        from: "question_types",
                        localField: "root_type",
                        foreignField: "_id",
                        as: "questionTypeInLookUp"
                    }
                },
                {
                    '$unwind': {
                        'path': '$questionTypeInLookUp'
                    }
                },
                {
                    $group: {
                        "_id": {
                            'user_id': "$user_id",
                            'root_type': "$root_type",
                        },
                        count: {
                            $sum: 1
                        },
                        symbolQuestionType: {
                            $first: "$questionTypeInLookUp.symbol"
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
            const tests = await TestModel.deleteMany({user_id: {$in: user_ids}});
            return tests;
        } catch (error) {
            return error;
        }
    },
    countScoreByUserIds: async function (user_ids) {
        try {
            return await TestModel.aggregate([
                {
                    '$match': {
                        'score': {
                            '$ne': null
                        },
                        'user_id': {
                            '$in': user_ids
                        }
                    }
                }, {
                    '$group': {
                        '_id': '$user_id',
                        'id': {
                            '$first': '$user_id'
                        },
                        'count_test': {
                            '$sum': 1
                        }
                    }
                }
            ]);
        } catch (error) {
            return error;
        }
    }
};
