const {QuestionModel} = require('../models');
const excelJS = require('exceljs');
const commonFunctions = require('../utils/common_functions');
const ErrorMessage = require('../utils/errorMessage').ErrorMessage;
const questionTypeRepository = require('../repositories/question_type.repository');
const {
    LEVEL,
    IMAGE_TYPE,
    QUESTION_FIELD,
    QUESTION_DETAIL_FIELD,
    QUESTION_STATUS,
    QUESTION_FIELD_USER,
} = require('../utils/consts');

module.exports = {
    importQuestionFromExcel: async function (res, fileName) {
        const workbook = new excelJS.Workbook();
        const questionRow = [];
        await workbook.xlsx
            .readFile(process.cwd() + '/uploads/file_import/' + fileName)
            .then(async function () {
                // use workbook
                const worksheet = workbook.getWorksheet();
                let checkFormat = false;
                let isFirst = true;
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

                    const excelFormat = [
                        '大分類 名称',
                        '大分類 名称',
                        'レベル',
                        '小分類 記号',
                        '小分類',
                        '固有名称',
                        'No.',
                        'テストの種類',
                        'ファイルネーム',
                        '問題文',
                        '選択肢1',
                        '選択肢2',
                        '選択肢3',
                        '選択肢4',
                        '正解',
                    ];
                    //check format file
                    if (!checkFormat && !isFirst) {
                        const checked = commonFunctions.checkFormatExcel(row, excelFormat);
                        if (!checked) {
                            return res.status(400).send({
                                data: null,
                                message: ErrorMessage.FORMAT_EXCEL_IS_INCORRECT,
                            });
                        }
                        checkFormat = true;
                    } else {
                        questionRow.push(row);
                    }
                    isFirst = false;
                });
            });
        const questionNews = [];
        for (let j = 0; j < questionRow.length; j += 100) {
            const questions = questionRow.slice(j, j + 100);
            for (let i = 0; i < questions.length; i++) {
                // push array
                const questionNew = {};

                // Check question type
                const questionTypeName1 = !questions[i][1] ? '' : questions[i][1];
                const questionTypeName2 = !questions[i][3]
                    ? ''
                    : questions[i][3] === 'A'
                    ? '骨名称'
                    : questions[i][3] === 'B'
                    ? '骨ランドマーク'
                    : questions[i][3] === 'C'
                    ? '筋肉名称'
                    : questions[i][3] === 'D'
                    ? '筋肉起始停止'
                    : questions[i][3] === 'E'
                    ? '筋肉機能'
                    : questions[i][3] === 'F'
                    ? '動き名称'
                    : '骨名称';
                const questionTypeName3 = !questions[i][4] ? '' : questions[i][4];
                const questionTypeName4 = !questions[i][5] ? '' : questions[i][5];

                if (!questionTypeName1) {
                    continue;
                }

                const questionType1 = await questionTypeRepository.getQuestionType({
                    name: questionTypeName1,
                });

                if (!questionType1) {
                    continue;
                } else {
                    questionNew.root_type = questionType1._id;
                    const questionType2 = await questionTypeRepository.getQuestionType({
                        parent_id: questionType1._id,
                        name: questionTypeName2,
                    });

                    if (!questionType2 || !questionTypeName2) {
                        continue;
                    } else {
                        questionNew.child_type = !questionType2 ? '' : questionType2._id;
                        const questionType3 = await questionTypeRepository.getQuestionType({
                            parent_id: questionType2._id,
                            name: questionTypeName3,
                        });
                        if (!questionType3 || !questionTypeName3) {
                            continue;
                        } else {
                            questionNew.last_type = !questionType3 ? '' : questionType3._id;
                            const questionType4 = await questionTypeRepository.getQuestionType({
                                parent_id: questionType3._id,
                                name: questionTypeName4,
                            });
                            if (!questionType4 || !questionTypeName4) {
                                continue;
                            } else {
                                questionNew.question_type_id = questionType4._id;
                            }
                        }
                    }
                }

                if (
                    !questions[i][9] ||
                    !questions[i][2] ||
                    !questions[i][7] ||
                    !questions[i][10] ||
                    !questions[i][11] ||
                    !questions[i][12] ||
                    !questions[i][13] ||
                    !questions[i][14]
                ) {
                    continue;
                }

                if (!questions[i][8] && (questions[i][7] == 'B' || questions[i][7] == 'C')) {
                    continue;
                }

                questionNew.title = questions[i][9];
                questionNew.level =
                    questions[i][2] === 1
                        ? LEVEL.LEVEL_1
                        : questions[i][2] === 2
                        ? LEVEL.LEVEL_2
                        : LEVEL.LEVEL_1;
                questionNew.image_type =
                    questions[i][7] == 'A'
                        ? IMAGE_TYPE.TEXT
                        : questions[i][7] == 'B'
                        ? IMAGE_TYPE.IMAGE
                        : questions[i][7] == 'C'
                        ? IMAGE_TYPE.AMINATION
                        : IMAGE_TYPE.TEXT;
                questionNew.option_1 = questions[i][10];
                questionNew.option_2 = questions[i][11];
                questionNew.option_3 = questions[i][12];
                questionNew.option_4 = questions[i][13];
                questionNew.correct_answer = questions[i][14];
                if (questions[i][8] && (questions[i][7] == 'B' || questions[i][7] == 'C')) {
                    questionNew.path_file = questions[i][8];
                }
                questionNews.push(questionNew);
            }
            if (questionNews.length !== 0) {
                await QuestionModel.insertMany(questionNews);
            }
            await Promise.all(questions);
        }
        if (questionNews.length === 0) {
            return res.status(400).send({
                data: null,
                message: ErrorMessage.IMPORT_EXCEL_IS_NOT_SUCCESS,
            });
        }
        if (questionNews.length < questionRow.length - 1) {
            return res.status(400).send({
                data: null,
                message:
                    questionNews.length +
                    '/' +
                    (questionRow.length - 1) +
                    ' 問のインポートに成功しました',
            });
        }
    },
    create: async function (newQuestion) {
        const question = await QuestionModel.create(newQuestion);
        if (!question) {
            return null;
        }
        return {
            _id: question.id,
            title: question.title,
            level: question.level,
            root_type: question.root_type,
            child_type: question.child_type,
            last_type: question.last_type,
            question_type_id: question.question_type_id,
            image_type: question.image_type,
            path_file: question.path_file,
            option_1: question.option_1,
            option_2: question.option_2,
            option_3: question.option_3,
            option_4: question.option_4,
            correct_answer: question.correct_answer,
        };
    },
    count: async function (where) {
        try {
            const count = await QuestionModel.countDocuments(where);
            return count;
        } catch (error) {
            return error;
        }
    },
    findAll: async function (findParams, pagination) {
        try {
            const questions = await QuestionModel.find(findParams)
                .populate('root_type')
                .populate('child_type')
                .select(QUESTION_FIELD)
                .skip((pagination.page - 1) * pagination.perPage)
                .limit(pagination.perPage)
                .sort('-created_at');
            return questions;
        } catch (error) {
            return null;
        }
    },
    findById: async function (id) {
        const question = await QuestionModel.findOne({_id: id})
            .populate('root_type')
            .populate('child_type')
            .populate('last_type')
            .populate('question_type_id')
            .select(QUESTION_DETAIL_FIELD);
        if (!question) {
            return null;
        }
        return question;
    },
    update: async function (id, where) {
        try {
            await QuestionModel.updateOne({_id: id}, {$set: where});
            const question = await QuestionModel.findOne({_id: id});
            return question;
        } catch (error) {
            return error;
        }
    },
    findAllQuestion: async function (findParams) {
        try {
            const questions = await QuestionModel.find(findParams)
                .populate('child_type')
                .select(QUESTION_FIELD_USER);
            return questions;
        } catch (error) {
            return null;
        }
    },
    findAllWithArrayIds: async function (ids) {
        try {
            const questions = await QuestionModel.find({_id: {$in: ids}});
            return questions;
        } catch (error) {
            return error;
        }
    },
    deleteMany: async function (ids) {
        try {
            const questions = await QuestionModel.updateMany(
                {_id: {$in: ids}, status: {$ne: QUESTION_STATUS.SUSPEND}},
                {status: QUESTION_STATUS.SUSPEND},
                {new: true},
            );
            return questions;
        } catch (error) {
            return error;
        }
    },
    randomQuestion: async function (positive) {
        try {
            const questions = await await QuestionModel.aggregate([
                {$match: {status: QUESTION_STATUS.ACTIVE}},
                {$sample: {size: positive}},
            ]);
            return questions;
        } catch (error) {
            return error;
        }
    },
};
