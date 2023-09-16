const {QuestionTypeModel} = require('../models');
const excelJS = require('exceljs');
const commonFunctions = require('../utils/common_functions');
const {QUESTION_TYPE_FIELD, QUESTION_TYPE_STATUS} = require('../utils/consts');
const ErrorMessage = require('../utils/errorMessage').ErrorMessage;

module.exports = {
    importQuestionTypeFromExcel: async function (req, res, fileName) {
        const workbook = new excelJS.Workbook();
        const questionTypeRow = [];
        await workbook.xlsx
            .readFile(process.cwd() + '/uploads/file_import/' + fileName)
            .then(async function () {
                // use workbook
                const worksheet = workbook.getWorksheet('Child_level_3_F');
                let checkFormat = false;
                worksheet.eachRow({includeEmpty: false}, async function (row) {
                    row = row.values;
                    row.splice(0, 1);

                    // format text
                    for (let i = 0; i < row.length; i++) {
                        let txt = '';
                        if (typeof row[i] === 'object') {
                            const arr = row[i].richText;
                            for (let j = 0; j < arr.length; j++) {
                                txt += arr[j].text;
                            }
                            row[i] = txt;
                        }
                    }

                    // parent
                    //const excelFormatParent = ['Name'];
                    const excelFormatChild = ['Name 1', 'Name 2', 'Name 3', 'Name 4'];
                    //check format file
                    if (!checkFormat) {
                        const checked = commonFunctions.checkFormatExcel(row, excelFormatChild);
                        if (!checked) {
                            return res.status(400).send({
                                data: null,
                                message: ErrorMessage.FORMAT_EXCEL_IS_INCORRECT,
                            });
                        }
                        checkFormat = true;
                    } else {
                        questionTypeRow.push(row);
                    }
                });
            });
        const questionTypes = [];
        for (let i = 0; i < questionTypeRow.length; i++) {
            // push array
            const questionType = {};

            // parent
            //questionType.name = !questionTypeRow[i][0] ? '' : questionTypeRow[i][0];

            // child
            const nameQuestionType1 = !questionTypeRow[i][0] ? '' : questionTypeRow[i][0];
            const questionType1 = await QuestionTypeModel.findOne({name: nameQuestionType1}).select(
                QUESTION_TYPE_FIELD,
            );

            if (!questionType1) {
                continue;
            }
            const nameQuestionType2 = !questionTypeRow[i][1] ? '' : questionTypeRow[i][1];
            const questionType2 = await QuestionTypeModel.findOne({
                name: nameQuestionType2,
                parent_id: questionType1._id,
            }).select(QUESTION_TYPE_FIELD);
            const nameQuestionType3 = !questionTypeRow[i][2] ? '' : questionTypeRow[i][2];
            const questionType3 = await QuestionTypeModel.findOne({
                name: nameQuestionType3,
                parent_id: questionType2._id,
            }).select(QUESTION_TYPE_FIELD);
            const nameQuestionType4 = !questionTypeRow[i][3] ? '' : questionTypeRow[i][3];
            questionType.parent_id = questionType3._id;
            questionType.name = nameQuestionType4;
            questionTypes.push(questionType);
        }
        if (questionTypes.length !== 0) {
            await QuestionTypeModel.insertMany(questionTypes);
        }
    },
    getQuestionType: async function (params) {
        try {
            const questionType = await QuestionTypeModel.findOne(params).select(
                QUESTION_TYPE_FIELD,
            );

            return questionType;
        } catch (error) {
            return null;
        }
    },
    findById: async function (id) {
        try {
            const questionType = await QuestionTypeModel.findOne({_id: id})
                .populate({
                    path: 'parent_id',
                    model: 'Question_Type',
                    populate: {
                        path: 'parent_id',
                        model: 'Question_Type',
                        populate: {
                            path: 'parent_id',
                            model: 'Question_Type',
                            populate: {
                                path: 'parent_id',
                                model: 'Question_Type',
                            },
                        },
                    },
                })
                .select(QUESTION_TYPE_FIELD);

            return questionType;
        } catch (error) {
            return null;
        }
    },
    findAll: async function (findParams, pagination) {
        try {
            const questiontypes = await QuestionTypeModel.find(findParams)
                .populate([
                    {
                        path: 'items',
                        populate: [
                            {
                                path: 'items',
                                populate: [
                                    {
                                        path: 'items',
                                    },
                                ],
                            },
                        ],
                    },
                ])
                .skip((pagination.page - 1) * pagination.perPage)
                .limit(pagination.perPage)
                .sort('+symbol');
            return questiontypes;
        } catch (error) {
            return null;
        }
    },
    count: async function (where) {
        try {
            const count = await QuestionTypeModel.countDocuments(where);
            return count;
        } catch (error) {
            return error;
        }
    },
    create: async function (questionTypeNew) {
        try {
            const questionType = await QuestionTypeModel.create(questionTypeNew);
            if (!questionType) {
                return null;
            }
            return questionType;
        } catch (error) {
            return null;
        }
    },
    update: async function (id, where) {
        try {
            await QuestionTypeModel.updateOne({_id: id}, {$set: where});
            const questionType = await QuestionTypeModel.findOne({_id: id});
            return questionType;
        } catch (error) {
            return error;
        }
    },
    getRootType: async function () {
        const questionType = await QuestionTypeModel.find({parent_id: null});
        if (!questionType) {
            return null;
        }
        return questionType;
    },
    getQuestionTypeAll: async function () {
        try {
            const questiontypes = await QuestionTypeModel.find({
                status: QUESTION_TYPE_STATUS.ACTIVE,
            });
            return questiontypes;
        } catch (error) {
            return null;
        }
    },
    getQuestionTypeAllSortBySymbol: async function (findParams) {
        try {
            const questiontypes = await QuestionTypeModel.find(findParams).sort('+symbol');
            return questiontypes;
        } catch (error) {
            return null;
        }
    },
    deleteMany: async function (ids) {
        try {
            const questiontypes = await QuestionTypeModel.deleteMany({_id: {$in: ids}});
            return questiontypes;
        } catch (error) {
            return error;
        }
    },
    deleteOne: async function (id) {
        try {
            const questionType = await QuestionTypeModel.deleteOne({_id: id});
            return questionType;
        } catch (error) {
            return error;
        }
    },
};
