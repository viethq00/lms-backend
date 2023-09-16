const questionRepository = require('../../repositories/question.repository');
const questionTypeRepository = require('../../repositories/question_type.repository');
const answerRepository = require('../../repositories/answer.repository');
const statisticRepository = require('../../repositories/statistic.repository');
const uploadExcelRepository = require('../../repositories/upload_excel.repository');
const {validationResult} = require('express-validator');
const ErrorMessage = require('../../utils/errorMessage').ErrorMessage;
const {
    _errorFormatter,
    addMongooseParam,
    getHeaders,
    checkExistedQuestion,
} = require('../../utils/helper');
const logger = require('../../utils/logger');
const commonFunctions = require('../../utils/common_functions');
const {
    handlerSuccess,
    handlerBadRequestError,
    handlerNotFoundError,
} = require('../../utils/handler.response');
const {
    IMAGE_TYPE,
    QUESTION_STATUS,
    URL_QUESTION_FORM,
    URL_BASE,
    USER_ANSWER,
} = require('../../utils/consts');
const ObjectID = require('mongodb').ObjectID;

module.exports = {
    classname: 'QuestionController',

    /**
     * Function import question from excel
     * @author    LinhHTM
     * @date      2021/11/03
     */
    importQuestionFromExcel: async (req, res, next) => {
        try {
            const errors = validationResult(req);
            // response status code 200 even if error
            if (!errors.isEmpty()) {
                const errorMsg = _errorFormatter(errors.array());
                return handlerBadRequestError(req, res, errorMsg);
            }
            //upload file
            await uploadExcelRepository(req, res);

            const fileName = req.file.originalname;
            await questionRepository.importQuestionFromExcel(res, fileName);

            return handlerSuccess(req, res, ErrorMessage.IMPORT_EXCEL_IS_SUCCESS);
        } catch (error) {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        }
    },

    /**
     * Function create question
     * @author    LinhHTM
     * @date      2021/11/10
     */
    createQuestion: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            const newQuestion = {
                title: req.body.title,
                level: req.body.level,
                root_type: req.body.root_type,
                child_type: req.body.child_type,
                last_type: req.body.last_type,
                question_type_id: req.body.question_type_id,
                image_type: req.body.image_type,
                path_file: req.body.path_file,
                option_1: req.body.option_1,
                option_2: req.body.option_2,
                option_3: req.body.option_3,
                option_4: req.body.option_4,
                correct_answer: req.body.correct_answer * 1,
            };

            if (
                (newQuestion.image_type === IMAGE_TYPE.IMAGE && !newQuestion.path_file) ||
                (newQuestion.image_type === IMAGE_TYPE.AMINATION && !newQuestion.path_file)
            ) {
                return handlerBadRequestError(req, res, ErrorMessage.MISSING_PATH_FILE_PARAMETER);
            }

            const questionType = await questionTypeRepository.findById(req.body.question_type_id);
            const questionTypeRoot = await questionTypeRepository.findById(req.body.root_type);
            if (!questionType || !questionTypeRoot) {
                return handlerNotFoundError(req, res, ErrorMessage.QUESTION_TYPE_NOT_FOUND);
            }

            const createQuestion = await questionRepository.create(newQuestion);

            return handlerSuccess(req, res, createQuestion);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function list question
     * @author    Linhhtm
     * @date      2021/11/12
     */
    async indexQuestions(req, res, next) {
        try {
            const findParams = getFindParams(req.query);
            const page = +req.query.page || 1;
            const perPage = +req.query.limit || 20;

            const count = await questionRepository.count(findParams);
            const responseHeaders = getHeaders(count, page, perPage);

            const questions = await questionRepository.findAll(findParams, {
                page,
                perPage,
            });
            const result = [];
            for (let i = 0; i < questions.length; i++) {
                const number_occurrences = await answerRepository.count({
                    question_id: questions[i]._id,
                });
                const number_correct_answer = await answerRepository.count({
                    question_id: questions[i]._id,
                    user_answer: USER_ANSWER.CORRECT,
                });
                const percentage =
                    Math.round((number_correct_answer / number_occurrences) * 100) / 100;
                result.push({
                    _id: questions[i]._id,
                    title: questions[i].title,
                    level: questions[i].level,
                    root_type: questions[i].root_type,
                    child_type: questions[i].child_type,
                    image_type: questions[i].image_type,
                    path_file:
                        questions[i].image_type === IMAGE_TYPE.IMAGE
                            ? (questions[i].path_file =
                                  URL_BASE + 'image/' + questions[i].path_file)
                            : questions[i].image_type === IMAGE_TYPE.AMINATION
                            ? (questions[i].path_file =
                                  URL_BASE + 'animation/' + questions[i].path_file)
                            : '',
                    status: questions[i].status,
                    correct_answer: questions[i].correct_answer * 1,
                    number_occurrences: number_occurrences,
                    percentage: percentage,
                });
            }

            return handlerSuccess(req, res, {
                items: result,
                headers: responseHeaders,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function detail question
     * @author    Linhhtm
     * @date      2021/11/15
     */
    async getDetailQuestion(req, res, next) {
        try {
            const question = await questionRepository.findById(req.params.id);
            if (!question) {
                return handlerNotFoundError(req, res, ErrorMessage.QUESTION_IS_NOT_FOUND);
            }
            const number_occurrences = await answerRepository.count({question_id: question._id});
            const number_correct_answer = await answerRepository.count({
                question_id: question._id,
                user_answer: USER_ANSWER.CORRECT,
            });
            const percentage = Math.round((number_correct_answer / number_occurrences) * 100) / 100;
            const questionObject = {
                _id: question._id,
                title: question.title,
                level: question.level,
                root_type: question.root_type,
                question_type_id: question.question_type_id,
                child_type: question.child_type,
                last_type: question.last_type,
                image_type: question.image_type,
                path_file:
                    question.image_type === IMAGE_TYPE.IMAGE
                        ? (question.path_file = URL_BASE + 'image/' + question.path_file)
                        : question.image_type === IMAGE_TYPE.AMINATION
                        ? (question.path_file = URL_BASE + 'animation/' + question.path_file)
                        : '',
                option_1: question.option_1,
                option_2: question.option_2,
                option_3: question.option_3,
                option_4: question.option_4,
                correct_answer: question.correct_answer * 1,
                number_occurrences: number_occurrences,
                percentage: percentage,
            };

            return handlerSuccess(req, res, questionObject);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function update question
     * @author    Linhhtm
     * @date      2021/11/15
     */
    async updateQuestion(req, res, next) {
        try {
            const question = await questionRepository.findById(req.params.id);
            if (!question) {
                return handlerBadRequestError(req, res, ErrorMessage.QUESTION_IS_NOT_FOUND);
            }

            if (question.status === QUESTION_STATUS.SUSPEND) {
                return handlerBadRequestError(req, res, ErrorMessage.QUESTION_IS_NOT_UPDATED);
            } else {
                const data = await getUpdateBodys(req.body);
                if (data.errors.length > 0) {
                    return handlerBadRequestError(req, res, data.errors.join(', '));
                }

                const update = await questionRepository.update(req.params.id, data.updateBodys);
                if (!update) {
                    return handlerNotFoundError(req, res, ErrorMessage.QUESTION_IS_NOT_UPDATED);
                }

                return handlerSuccess(req, res, update);
            }
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function update status question
     * @author    Linhhtm
     * @date      2021/11/16
     */
    async updateStatus(req, res, next) {
        try {
            if (!req.query.id) {
                return handlerBadRequestError(req, res, ErrorMessage.MISSING_QUESTION_ID_PARAMETER);
            }

            if (!req.query.status) {
                return handlerBadRequestError(req, res, ErrorMessage.MISSING_STATUS_PARAMETER);
            }

            const question = await questionRepository.findById(req.query.id);
            if (!question) {
                return handlerBadRequestError(req, res, ErrorMessage.QUESTION_IS_NOT_FOUND);
            }

            if (req.query.status === QUESTION_STATUS.SUSPEND) {
                return handlerNotFoundError(req, res, ErrorMessage.QUESTION_IS_NOT_EXISTED);
            } else {
                const status = {status: req.query.status};
                const updateStatus = await questionRepository.update(req.query.id, status);
                return handlerSuccess(req, res, updateStatus);
            }
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function download question example file to import question
     * @author    Linhhtm
     * @date      2021/11/16
     */
    async download(req, res, next) {
        try {
            const fileExists = commonFunctions.checkFileExists('Question_data_example.xlsx');
            if (!fileExists) {
                return handlerBadRequestError(req, res, ErrorMessage.FILE_IS_NOT_EXISTED);
            }
            return handlerSuccess(req, res, URL_BASE + URL_QUESTION_FORM);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function delete question
     * @author    Linhhtm
     * @date      2021/12/06
     */
    async deleteQuestion(req, res, next) {
        try {
            const question_ids = req.body;

            question_ids.forEach((item) => {
                if (ObjectID.isValid(item) === false) {
                    return handlerBadRequestError(req, res, `Id '${item}' is not ObjectId`);
                }
            });

            const errorIds = await checkExistedQuestion(questionRepository, question_ids);
            if (errorIds.length > 0) {
                return handlerBadRequestError(
                    req,
                    res,
                    `Ids '${errorIds.join(', ')}' is not found!`,
                );
            }

            // update statistic
            await updateStatistic(question_ids);

            // delete answer
            const answers = await answerRepository.findAll({question_id: {$in: question_ids}});
            const answer_ids = answers.map((answer) => answer._id);
            await answerRepository.deleteMany(answer_ids);

            // delete question
            const deleteQuestions = await questionRepository.deleteMany(question_ids);
            return handlerSuccess(req, res, deleteQuestions);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },
};
function getFindParams(filters) {
    const findByTitle = {};
    if (filters.title) {
        findByTitle.title = addMongooseParam(
            findByTitle.title,
            '$regex',
            new RegExp(filters.title, 'i'),
        );
    }

    const findByRootType = {};
    if (filters.root_type) {
        findByRootType.root_type = filters.root_type;
    }

    const findByChildType = {};
    if (filters.child_type) {
        findByChildType.child_type = filters.child_type;
    }

    const findByImageType = {};
    if (filters.image_type) {
        findByImageType.image_type = filters.image_type;
    }

    const findByStatus = {};
    if (filters.status) {
        findByStatus.status = filters.status;
    } else {
        findByStatus.status = {$in: [QUESTION_STATUS.ACTIVE, QUESTION_STATUS.INACTIVE]};
    }

    const findBylevel = {};
    if (filters.level) {
        findBylevel.level = filters.level;
    }

    const findParams = {
        $and: [
            findByTitle,
            findByRootType,
            findByChildType,
            findByImageType,
            findByStatus,
            findBylevel,
        ],
    };

    return findParams;
}

async function getUpdateBodys(updates) {
    const updateBodys = {};
    const errors = [];

    if (updates.title) {
        updateBodys.title = updates.title;
    }

    if (updates.level) {
        updateBodys.level = updates.level;
    }

    if (updates.root_type) {
        const rootType = await questionTypeRepository.findById(updates.root_type);
        if (!rootType) {
            errors.push(ErrorMessage.QUESTION_TYPE_NOT_FOUND);
        }
        updateBodys.root_type = updates.root_type;
    }

    if (updates.child_type) {
        const childType = await questionTypeRepository.findById(updates.child_type);
        if (!childType) {
            errors.push(ErrorMessage.QUESTION_TYPE_NOT_FOUND);
        }
        updateBodys.child_type = updates.child_type;
    }

    if (updates.last_type) {
        const lastType = await questionTypeRepository.findById(updates.last_type);
        if (!lastType) {
            errors.push(ErrorMessage.QUESTION_TYPE_NOT_FOUND);
        }
        updateBodys.last_type = updates.last_type;
    }

    if (updates.question_type_id) {
        const questionType = await questionTypeRepository.findById(updates.question_type_id);
        if (!questionType) {
            errors.push(ErrorMessage.QUESTION_TYPE_NOT_FOUND);
        }
        updateBodys.question_type_id = updates.question_type_id;
    }

    if (updates.image_type) {
        updateBodys.image_type = updates.image_type;
    }

    updateBodys.path_file = updates.path_file;

    if (updates.option_1) {
        updateBodys.option_1 = updates.option_1;
    }

    if (updates.option_2) {
        updateBodys.option_2 = updates.option_2;
    }

    if (updates.option_3) {
        updateBodys.option_3 = updates.option_3;
    }

    if (updates.option_4) {
        updateBodys.option_4 = updates.option_4;
    }

    if (updates.correct_answer) {
        updateBodys.correct_answer = updates.correct_answer;
    }

    return {updateBodys: updateBodys, errors: errors};
}

async function updateStatistic(questionIds) {
    const answers = await answerRepository.findAll({
        question_id: {$in: questionIds},
        user_answer: USER_ANSWER.CORRECT,
    });
    for (let i = 0; i < answers.length; i++) {
        const statistic = await statisticRepository.findByUserId(answers[i].user_id);
        const child_type = {
            child_type_A: statistic.child_type.child_type_A,
            child_type_B: statistic.child_type.child_type_B,
            child_type_C: statistic.child_type.child_type_C,
            child_type_D: statistic.child_type.child_type_D,
            child_type_E: statistic.child_type.child_type_E,
            child_type_F: statistic.child_type.child_type_F,
        };
        const root_type = {
            root_type_A: statistic.root_type.root_type_A,
            root_type_B: statistic.root_type.root_type_B,
            root_type_C: statistic.root_type.root_type_C,
            root_type_D: statistic.root_type.root_type_D,
            root_type_E: statistic.root_type.root_type_E,
            root_type_F: statistic.root_type.root_type_F,
        };
        const question = await questionRepository.findById(answers[i].question_id);
        const root_question_type = await questionTypeRepository.findById(question.root_type);
        const child_question_type = await questionTypeRepository.findById(question.child_type);
        root_type['root_type_' + root_question_type.symbol] -= 1;
        child_type['child_type_' + child_question_type.symbol] -= 1;
        await statisticRepository.update(statistic._id, {
            child_type: child_type,
            root_type: root_type,
        });
    }
}
