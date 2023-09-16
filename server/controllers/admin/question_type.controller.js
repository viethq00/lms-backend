const questionTypeRepository = require('../../repositories/question_type.repository');
const questionRepository = require('../../repositories/question.repository');
const answerRepository = require('../../repositories/answer.repository');
const uploadExcelRepository = require('../../repositories/upload_excel.repository');
const {validationResult} = require('express-validator');
const ErrorMessage = require('../../utils/errorMessage').ErrorMessage;
const {
    handlerSuccess,
    handlerBadRequestError,
    handlerNotFoundError,
} = require('../../utils/handler.response');
const {_errorFormatter, getHeaders} = require('../../utils/helper');
const logger = require('../../utils/logger');
const {QUESTION_TYPE_STATUS, USER_ANSWER, QUESTION_STATUS} = require('../../utils/consts');

module.exports = {
    classname: 'QuestionTypeController',

    /**
     * Function import question type from excel
     * @author    LinhHTM
     * @date      2021/11/03
     */
    importQuestionTypeFromExcel: async (req, res, next) => {
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
            await questionTypeRepository.importQuestionTypeFromExcel(req, res, fileName);

            return handlerSuccess(req, res, ErrorMessage.IMPORT_EXCEL_IS_SUCCESS);
        } catch (error) {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        }
    },

    /**
     * Function list question type
     * @author    Linhhtm
     * @date      2021/11/19
     */
    async indexQuestionTypes(req, res, next) {
        try {
            const findParams = {
                parent_id: null,
                status: QUESTION_TYPE_STATUS.ACTIVE,
            };
            const page = +req.query.page || 1;
            const perPage = +req.query.perPage || 20;

            const count = await questionTypeRepository.count(findParams);
            const responseHeaders = getHeaders(count, page, perPage);

            const questionTypes = await questionTypeRepository.findAll(findParams, {
                page,
                perPage,
            });

            return handlerSuccess(req, res, {
                items: questionTypes,
                headers: responseHeaders,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function created question type
     * @author    Linhhtm
     * @date      2021/12/01
     */
    created: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            const questionTypeNew = {
                parent_id: req.body.parent_id,
                name: req.body.name,
            };

            const createQuestionType = await questionTypeRepository.create(questionTypeNew);
            return handlerSuccess(req, res, createQuestionType);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function updated question type
     * @author    Linhhtm
     * @date      2021/12/01
     */
    async updated(req, res, next) {
        try {
            const questionType = await questionTypeRepository.findById(req.params.id);
            if (!questionType) {
                return handlerNotFoundError(req, res, ErrorMessage.QUESTION_TYPE_NOT_FOUND);
            }

            if (questionType.status === QUESTION_TYPE_STATUS.SUSPEND) {
                return handlerBadRequestError(req, res, ErrorMessage.QUESTION_TYPE_IS_NOT_UPDATED);
            } else {
                const data = req.body;

                const update = await questionTypeRepository.update(req.params.id, data);
                if (!update) {
                    return handlerBadRequestError(
                        req,
                        res,
                        ErrorMessage.QUESTION_TYPE_IS_NOT_UPDATED,
                    );
                }

                return handlerSuccess(req, res, update);
            }
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function detail question type
     * @author    Linhhtm
     * @date      2021/12/01
     */
    getDetailQuestionType: async (req, res, next) => {
        try {
            const questionType = await questionTypeRepository.findById(req.params.id);
            if (!questionType) {
                return handlerNotFoundError(req, res, ErrorMessage.QUESTION_TYPE_NOT_FOUND);
            }

            const result = {
                _id: questionType._id,
                id: questionType.id,
                name: questionType.name,
                symbol: questionType.symbol,
                status: questionType.status,
                created_at: questionType.created_at,
                updated_at: questionType.updated_at,
                parent_id: questionType.parent_id,
            };

            // question type level 1
            if (!questionType.parent_id) {
                const questions = await questionRepository.findAllQuestion({
                    root_type: questionType._id,
                    status: QUESTION_STATUS.ACTIVE,
                });
                const question_result = await getPercentage(questions);
                result.number_question = question_result.number_question;
                result.percentage = question_result.percentage;
            } else {
                // question type level 2
                if (!questionType.parent_id.parent_id) {
                    const questions = await questionRepository.findAllQuestion({
                        child_type: questionType._id,
                        status: QUESTION_STATUS.ACTIVE,
                    });
                    const question_result = await getPercentage(questions);
                    result.number_question = question_result.number_question;
                    result.percentage = question_result.percentage;
                } else {
                    // question type level 3
                    if (!questionType.parent_id.parent_id.parent_id) {
                        const questions = await questionRepository.findAllQuestion({
                            last_type: questionType._id,
                            status: QUESTION_STATUS.ACTIVE,
                        });
                        const question_result = await getPercentage(questions);
                        result.number_question = question_result.number_question;
                        result.percentage = question_result.percentage;
                    } else {
                        // question type level 4
                        const questions = await questionRepository.findAllQuestion({
                            question_type_id: questionType._id,
                            status: QUESTION_STATUS.ACTIVE,
                        });
                        const question_result = await getPercentage(questions);
                        result.number_question = question_result.number_question;
                        result.percentage = question_result.percentage;
                    }
                }
            }

            return handlerSuccess(req, res, result);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function list question type all not filter
     * @author    Linhhtm
     * @date      2021/12/01
     */
    async getQuestionTypeAll(req, res, next) {
        try {
            const questionTypes = await questionTypeRepository.getQuestionTypeAll();

            return handlerSuccess(req, res, questionTypes);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function delete question type
     * @author    Linhhtm
     * @date      2022/02/24
     */
    async deleted(req, res, next) {
        try {
            const questionTypes = await questionTypeRepository.getQuestionTypeAllSortBySymbol({
                parent_id: req.params.id,
            });
            if (questionTypes.length !== 0) {
                const ids = [];
                for (let i = 0; i < Object.keys(questionTypes).length; i++) {
                    const itemName = Object.keys(questionTypes)[i];
                    const itemValue = questionTypes[itemName]._id;
                    ids.push(itemValue);
                }
                await questionTypeRepository.deleteMany(ids);
            }
            await questionTypeRepository.deleteOne(req.params.id);
            return handlerSuccess(req, res, 'Deleted Success');
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function delete question type many
     * @author    Linhhtm
     * @date      2022/02/24
     */
    async deletedMany(req, res, next) {
        try {
            const ids = req.body;
            const del = await questionTypeRepository.deleteMany(ids);
            return handlerSuccess(req, res, del);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },
};

async function getPercentage(questions) {
    const question_ids = questions.map((question) => question._id);
    const count_number_question = await answerRepository.count({question_id: {$in: question_ids}});
    const answers_correct = await answerRepository.count({
        question_id: {$in: question_ids},
        user_answer: USER_ANSWER.CORRECT,
    });
    return {
        number_question: count_number_question,
        percentage: Math.round((answers_correct / count_number_question) * 100) / 100,
    };
}
