const ErrorMessage = require('../../utils/errorMessage').ErrorMessage;
const logger = require('../../utils/logger');
const testRepository = require('../../repositories/test.repository');
const questionTypeRepository = require('../../repositories/question_type.repository');
const questionRepository = require('../../repositories/question.repository');
const answerRepository = require('../../repositories/answer.repository');
const statisticRepository = require('../../repositories/statistic.repository');
const aptitudeTestRepository = require('../../repositories/aptitude_test.repository');
const userRepository = require('../../repositories/user.repository');
const {_errorFormatter} = require('../../utils/helper');
const {validationResult} = require('express-validator');
const commonFunctions = require('../../utils/common_functions');
const {
    LEVEL,
    USER_ANSWER,
    QUESTION_TYPE_PARENT,
    QUESTION_STATUS,
    URL_BASE,
    IMAGE_TYPE,
} = require('../../utils/consts');
const {
    handlerSuccess,
    handlerBadRequestError,
    handlerNotFoundError,
} = require('../../utils/handler.response');
const {logUsedTime} = require('../../repositories/statistic_used_time.repository');

module.exports = {
    classname: 'UserTestController',

    /**
     * Function create test
     * @author    LinhHTM
     * @date      2021/11/18
     */
    createTest: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            // time using the app
            const account = await userRepository.findById(req.decoded.id);
            if (req.query.usage_time && account) {
                const time = +account.usage_time + +req.query.usage_time;
                await userRepository.update(req.decoded.id, {usage_time: time});
                // await historyUsedTimeRepository.create({
                //     used_time: req.query.usage_time,
                //     user_id: account._id,
                // });
                await logUsedTime(req);
            }

            if (!req.query.root_type) {
                // Aptitude test
                const questions = await questionRepository.randomQuestion(50);
                if (questions.length === 50) {
                    const questionIds = questions.map((question) => question._id);
                    const aptitude_test = await aptitudeTestRepository.create({
                        user_id: req.decoded.id,
                        question_ids: questionIds,
                    });
                    return handlerSuccess(req, res, {
                        id: aptitude_test._id,
                        user_id: aptitude_test.user_id,
                        questions: await getListQuestionAndCorrectAnswerValue(questionIds),
                        spend_times: aptitude_test.spend_times,
                        score: aptitude_test.score,
                    });
                } else {
                    return handlerBadRequestError(req, res, ErrorMessage.CREATE_TEST_NOT_SUCCESS);
                }
            } else {
                // Test random 10 questions
                const questionType = questionTypeRepository.findById(req.query.root_type);
                if (!questionType) {
                    return handlerNotFoundError(req, res, ErrorMessage.QUESTION_TYPE_NOT_FOUND);
                }
                const params = {
                    user_id: req.decoded.id,
                    root_type: req.query.root_type,
                };
                const questionIds = await generatorTest(params);
                if (questionIds.length === 10) {
                    const createTest = await testRepository.create({
                        user_id: req.decoded.id,
                        question_ids: questionIds,
                        root_type: req.query.root_type,
                    });
                    const questions = await getListQuestionAndCorrectAnswerValue(questionIds);
                    return handlerSuccess(req, res, {
                        id: createTest._id,
                        user_id: createTest.user_id,
                        root_type: createTest.root_type,
                        questions: questions,
                    });
                } else {
                    return handlerBadRequestError(req, res, ErrorMessage.CREATE_TEST_NOT_SUCCESS);
                }
            }
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function test result
     * @author    LinhHTM
     * @date      2021/11/24
     */
    testResult: async (req, res, next) => {
        try {
            const body = req.body.answers;

            //score of test
            const score = body.filter((answer) => {
                if (answer.user_answer === USER_ANSWER.CORRECT) {
                    return answer;
                }
            }).length;
            // time using the app
            const user = await userRepository.findById(req.decoded.id);
            if (req.query.usage_time && user) {
                const time = +user.usage_time + +req.query.usage_time;
                await userRepository.update(req.decoded.id, {usage_time: time});
                // await historyUsedTimeRepository.create({
                //     used_time: req.query.usage_time,
                //     user_id: user._id,
                // });
                await logUsedTime(req);
            }
            if (body.length === 50) {
                const aptitude_test = await aptitudeTestRepository.findById(req.query.test_id);
                if (!aptitude_test) {
                    return handlerNotFoundError(req, res, ErrorMessage.TEST_IS_NOT_FOUND);
                }

                const aptitudeTestUpdate = await aptitudeTestRepository.update(aptitude_test._id, {
                    score: +score * 2,
                    spend_times: req.body.spend_times,
                });

                // update user field hightest score
                if (user) {
                    const aptitude_test_hightest_score = await aptitudeTestRepository.findByUserId(
                        req.decoded.id,
                    );
                    await userRepository.update(req.decoded.id, {
                        hightest_score: aptitude_test_hightest_score.score,
                    });
                }

                return handlerSuccess(req, res, {
                    _id: aptitudeTestUpdate._id,
                    score: aptitudeTestUpdate.score,
                    spend_times: aptitudeTestUpdate.spend_times,
                    user_id: aptitudeTestUpdate.user_id,
                    number_test: await aptitudeTestRepository.count({
                        user_id: aptitudeTestUpdate.user_id,
                        score: {$ne: null},
                        spend_times: {$ne: null},
                    }),
                });
            } else {
                const test = await testRepository.findById(req.query.test_id);
                if (!test) {
                    return handlerNotFoundError(req, res, ErrorMessage.TEST_IS_NOT_FOUND);
                }

                const testUpdate = await testRepository.update(test._id, {score: score});

                const statistic = await statisticRepository.findByUserId(req.decoded.id);
                const number_question_root_type = await questionRepository.count({
                    root_type: testUpdate.root_type,
                    status: QUESTION_STATUS.ACTIVE,
                });
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

                const symbolRootType = await getSymbolRootType(testUpdate.root_type);
                const rank_root_type_old =
                    statistic.root_type['root_type_' + symbolRootType] === 0 && score !== 0
                        ? null
                        : commonFunctions.getRank(
                              statistic.root_type['root_type_' + symbolRootType],
                              number_question_root_type,
                          );

                // Save Answer
                for (let i = 0; i < body.length; i++) {
                    const answer = await answerRepository.findByQuestionIdAndUserId({
                        question_id: body[i].question_id,
                        user_id: req.decoded.id,
                    });
                    if (!answer) {
                        await answerRepository.create({
                            question_id: body[i].question_id,
                            user_answer: body[i].user_answer,
                            user_id: req.decoded.id,
                        });
                        if (body[i].user_answer === USER_ANSWER.CORRECT) {
                            root_type['root_type_' + symbolRootType] += 1;
                            child_type['child_type_' + body[i].child_type] += 1;
                        }
                    } else {
                        if (body[i].user_answer !== answer.user_answer) {
                            if (answer.user_answer === USER_ANSWER.CORRECT) {
                                child_type['child_type_' + body[i].child_type] -= 1;
                                root_type['root_type_' + symbolRootType] -= 1;
                            } else {
                                child_type['child_type_' + body[i].child_type] += 1;
                                root_type['root_type_' + symbolRootType] += 1;
                            }
                            await answerRepository.update(answer._id, {
                                user_answer: body[i].user_answer,
                            });
                        }
                    }
                }

                // rank
                const correct_answer =
                    root_type.root_type_A +
                    root_type.root_type_B +
                    root_type.root_type_C +
                    root_type.root_type_D +
                    root_type.root_type_E +
                    root_type.root_type_F;
                const number_question = await questionRepository.count({
                    status: QUESTION_STATUS.ACTIVE,
                });
                const rank = commonFunctions.getRank(correct_answer, number_question);
                const statisticUpdate = {
                    child_type: child_type,
                    root_type: root_type,
                    total_correct: correct_answer,
                };
                const rank_root_type_new = commonFunctions.getRank(
                    root_type['root_type_' + symbolRootType],
                    number_question_root_type,
                );

                if (statistic.rank !== rank) {
                    statisticUpdate.rank = rank;
                    statisticUpdate.date_rank = new Date();
                }

                const question_type = await questionTypeRepository.findById(test.root_type);
                // Update statistic
                await statisticRepository.update(statistic._id, statisticUpdate);
                return handlerSuccess(req, res, {
                    test: testUpdate,
                    rank_main: {
                        level_up: commonFunctions.checkLevelUp(statistic.rank, rank),
                        rank_old: statistic.rank,
                        rank_new: rank,
                    },
                    rank_root_type: {
                        level_up: commonFunctions.checkLevelUp(
                            rank_root_type_old,
                            rank_root_type_new,
                        ),
                        rank_old: rank_root_type_old,
                        rank_new: rank_root_type_new,
                        name_type: question_type.name,
                    },
                });
            }
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },
};

async function getSymbolRootType(root_type_id) {
    const questionType = await questionTypeRepository.findById(root_type_id);
    if (questionType) {
        switch (questionType.name) {
            case QUESTION_TYPE_PARENT.A:
                return 'A';
            case QUESTION_TYPE_PARENT.B:
                return 'B';
            case QUESTION_TYPE_PARENT.C:
                return 'C';
            case QUESTION_TYPE_PARENT.D:
                return 'D';
            case QUESTION_TYPE_PARENT.E:
                return 'E';
            case QUESTION_TYPE_PARENT.F:
                return 'F';
            default:
                break;
        }
    }
}

async function generatorTest(params) {
    // list question level 1
    // const questions = await questionRepository.findAllQuestion({
    //     level: LEVEL.LEVEL_1,
    //     status: QUESTION_STATUS.ACTIVE,
    // });
    // const question_ids = questions.map((question) => question._id);

    // list question level 1 by root_type
    const questions_level1_root = await questionRepository.findAllQuestion({
        level: LEVEL.LEVEL_1,
        root_type: params.root_type,
        status: QUESTION_STATUS.ACTIVE,
    });
    const question_ids_level1_root = questions_level1_root.map((question) => question._id);

    const correct_answers = await answerRepository.findAll({
        question_id: {$in: question_ids_level1_root},
        user_id: params.user_id,
        user_answer: USER_ANSWER.CORRECT,
    });
    // const percentage = correct_answers.length / question_ids.length;
    const percentage = correct_answers.length / questions_level1_root.length;

    // Number incorrect answer
    const incorrect_answers = await answerRepository.findAll({
        user_id: params.user_id,
        user_answer: USER_ANSWER.INCORRECT,
    });
    const incorrect_answer_ids = await getQuestionIdsActive(incorrect_answers, params.root_type);

    // number answer
    const answers = await answerRepository.findAll({
        user_id: params.user_id,
    });
    const question_ids_answer = await getQuestionIdsActive(answers, params.root_type);
    const questions_answer = await questionRepository.findAllQuestion({
        root_type: params.root_type,
        _id: {$in: question_ids_answer},
        status: QUESTION_STATUS.ACTIVE,
    });

    //The question the user answered
    // question level 1
    const user_answers_level1 = await answerRepository.findAll({
        question_id: {$in: question_ids_level1_root},
        user_id: params.user_id,
    });
    const ids_level1 = await getQuestionIdsActive(user_answers_level1, params.root_type);

    //The question is not on the test
    // question level 1
    const unused_question_level1 = await questionRepository.findAllQuestion({
        level: LEVEL.LEVEL_1,
        root_type: params.root_type,
        _id: {$nin: ids_level1},
        status: QUESTION_STATUS.ACTIVE,
    });
    const unused_question_ids_level1 = unused_question_level1.map((question) => question._id);

    // Incorrect answer
    // question level 1
    const correct_answers_level1 = await answerRepository.findAll({
        question_id: {$in: question_ids_level1_root},
        user_id: params.user_id,
        user_answer: USER_ANSWER.CORRECT,
    });
    const correct_question_ids_level1 = await getQuestionIdsActive(
        correct_answers_level1,
        params.root_type,
    );

    if (questions_answer.length === 0) {
        // Random question
        const question_ids = randomQuestion(10, unused_question_ids_level1);
        return question_ids;
    } else {
        const param = {
            incorrect_answers: incorrect_answers,
            unused_question_ids_level1: unused_question_ids_level1,
            incorrect_answer_ids: incorrect_answer_ids,
            correct_question_ids_level1: correct_question_ids_level1,
        };
        if (percentage >= 0.7) {
            param.root_type = params.root_type;
            param.user_id = params.user_id;
            param.unused_question_level1 = unused_question_level1;
            const question_ids = await generatorQuestionIdsMixLevel1AndLevel2(param);
            return question_ids;
        } else {
            const question_ids = await generatorQuestionIdsLevel1(param);
            return question_ids;
        }
    }
}

function randomQuestion(number, array) {
    const ids = [];
    const used = [];
    let duplicate = false;
    if (number >= array.length || array.length === 0) {
        return array;
    } else {
        for (let i = 0; i < number; i++) {
            while (duplicate == false) {
                const id = Math.floor(Math.random() * (array.length - 1));
                if (!used.includes(id)) {
                    ids.push(array[id]);
                    used.push(id);
                    duplicate = true;
                }
            }
            duplicate = false;
        }
        return ids;
    }
}

async function generatorQuestionIdsLevel1(params) {
    //variable to save list question result
    let question_ids = [];
    if (params.incorrect_answers.length >= 6) {
        // Random question
        question_ids = getFullQuestionByRandom(
            [10, 10],
            params.incorrect_answer_ids,
            params.unused_question_ids_level1,
            params.correct_question_ids_level1,
        );
    }
    if (params.incorrect_answers.length <= 3) {
        question_ids = getFullQuestionByRandom(
            [9, 10],
            params.incorrect_answer_ids,
            params.unused_question_ids_level1,
            params.correct_question_ids_level1,
        );
    }

    if (params.incorrect_answers.length > 3 && params.incorrect_answers.length < 6) {
        question_ids = getFullQuestionByRandom(
            [8, 10],
            params.incorrect_answer_ids,
            params.unused_question_ids_level1,
            params.correct_question_ids_level1,
        );
    }
    return question_ids;
}

async function generatorQuestionIdsMixLevel1AndLevel2(params) {
    // variable to save list questions result
    let question_level_1_result = [];
    let question_level_2_result = [];

    const questions_incorrect_level1 = [];
    const questions_incorrect_level2 = [];
    const questions_incorrect = await questionRepository.findAllQuestion({
        _id: {$in: params.incorrect_answer_ids},
    });

    questions_incorrect.forEach((question) => {
        if (question.level === LEVEL.LEVEL_1) {
            questions_incorrect_level1.push(question._id);
        } else questions_incorrect_level2.push(question._id);
        if (questions_incorrect_level1.length === 3 && questions_incorrect_level2.length === 7) {
            return questions_incorrect_level1.concat(questions_incorrect_level2);
        }
    });

    // list question level 2 by root_type
    const questions_level2 = await questionRepository.findAllQuestion({
        level: LEVEL.LEVEL_2,
        root_type: params.root_type,
        status: QUESTION_STATUS.ACTIVE,
    });
    const question_ids_level2 = questions_level2.map((question) => question._id);

    //The question the user answered
    // question level 2
    const user_answers_level2 = await answerRepository.findAll({
        question_id: {$in: question_ids_level2},
        user_id: params.user_id,
    });
    const ids_level2 = await getQuestionIdsActive(user_answers_level2, params.root_type);

    //The question is not on the test
    // question level 2
    const unused_question_level2 = await questionRepository.findAllQuestion({
        level: LEVEL.LEVEL_2,
        root_type: params.root_type,
        _id: {$nin: ids_level2},
        status: QUESTION_STATUS.ACTIVE,
    });
    const unused_question_ids_level2 = unused_question_level2.map((question) => question._id);

    // Incorrect answer
    // question level 2
    const correct_answers_level2 = await answerRepository.findAll({
        question_id: {$in: question_ids_level2},
        user_id: params.user_id,
        user_answer: USER_ANSWER.CORRECT,
    });
    const correct_question_ids_level2 = await getQuestionIdsActive(
        correct_answers_level2,
        params.root_type,
    );

    // get 3 questions level 1
    if (questions_incorrect_level1.length < 3) {
        if (questions_incorrect_level1.length === 2) {
            question_level_1_result = getFullQuestionByRandom(
                [3, 3],
                questions_incorrect_level1,
                params.unused_question_ids_level1,
                params.correct_question_ids_level1,
            );
        } else {
            question_level_1_result = getFullQuestionByRandom(
                [2, 3],
                questions_incorrect_level1,
                params.unused_question_ids_level1,
                params.correct_question_ids_level1,
            );
        }
    } else question_level_1_result = questions_incorrect_level1.slice(0, 3);

    // The first time combining level 1 and level 2
    if (questions_incorrect_level2.length === 0 && correct_answers_level2.length === 0) {
        // Get 7 new questions level 2
        const question_ids_level2_random = randomQuestion(7, question_ids_level2);

        // Get 3 questions level 1
        if (questions_incorrect_level1.length < 3) {
            return question_level_1_result.concat(question_ids_level2_random);
        } else {
            return questions_incorrect_level1.slice(0, 3).concat(question_ids_level2_random);
        }
    }

    // Get 7 question level 2
    //case percent incorrect level 2 >= 60% (60% of 7 => 4 questions)
    if (questions_incorrect_level2.length >= 4) {
        question_level_2_result = getFullQuestionByRandom(
            [7, 7],
            questions_incorrect_level2,
            unused_question_ids_level2,
            correct_question_ids_level2,
        );
    }
    //case percent incorrect level 2 <= 30% (30% of 7 => 2 questions)
    if (questions_incorrect_level2.length <= 2) {
        question_level_2_result = getFullQuestionByRandom(
            [6, 7],
            questions_incorrect_level2,
            unused_question_ids_level2,
            correct_question_ids_level2,
        );
    }

    if (questions_incorrect_level2.length > 2 && questions_incorrect_level2.length < 4) {
        question_level_2_result = getFullQuestionByRandom(
            [5, 7],
            questions_incorrect_level2,
            unused_question_ids_level2,
            correct_question_ids_level2,
        );
    }
    return question_level_1_result.concat(question_level_2_result);
}

// ratio = [8,10] ratio[0]: sum(incorrect, unused), ratio[1]: sum questions.
function getFullQuestionByRandom(
    ratio,
    incorrect_question_data,
    unused_question_data,
    correct_question_data,
) {
    const unused = randomQuestion(ratio[0] - incorrect_question_data.length, unused_question_data);
    const correct = randomQuestion(
        ratio[1] - incorrect_question_data.length - unused.length,
        correct_question_data,
    );
    return incorrect_question_data.concat(unused, correct);
}

// func for list questions and change correct_answer value
async function getListQuestionAndCorrectAnswerValue(questionIds) {
    const questions = await questionRepository.findAllQuestion({_id: {$in: questionIds}});
    if (questions.length !== 0) {
        questions.forEach((element) => {
            element.image_type === IMAGE_TYPE.IMAGE
                ? (element.path_file = URL_BASE + 'image/' + element.path_file)
                : element.image_type === IMAGE_TYPE.AMINATION
                ? (element.path_file = URL_BASE + 'animation/' + element.path_file)
                : '';
            element.correct_answer =
                element.correct_answer === '1'
                    ? element.option_1
                    : element.correct_answer === '2'
                    ? element.option_2
                    : element.correct_answer === '3'
                    ? element.option_3
                    : element.correct_answer === '4'
                    ? element.option_4
                    : element.correct_answer;
        });
    }
    return questions;
}

// Get question ids have status = active
async function getQuestionIdsActive(answers, root_type) {
    const question_ids = answers.map((answer) => answer.question_id);
    const questions_active = await questionRepository.findAllQuestion({
        root_type: root_type,
        _id: {$in: question_ids},
        status: QUESTION_STATUS.ACTIVE,
    });
    return questions_active.map((question) => question._id);
}
