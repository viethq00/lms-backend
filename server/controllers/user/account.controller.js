const userRepository = require('../../repositories/user.repository');
const {validationResult} = require('express-validator');
const ErrorMessage = require('../../utils/errorMessage').ErrorMessage;
const auth = require('../../utils/validate.token');
const {_errorFormatter} = require('../../utils/helper');
const logger = require('../../utils/logger');
const {
    EMAIL,
    QUESTION_TYPE_STATUS,
    USER_STATUS,
    USER_ROLES,
    QUESTION_STATUS,
} = require('../../utils/consts');
const bcrypt = require('bcryptjs');
const nodeMailer = require('nodemailer');
const {
    handlerSuccess,
    handlerBadRequestError,
    handlerNotFoundError,
    handlerPermissionDeniedError,
} = require('../../utils/handler.response');
const SALT_WORK_FACTOR = 10;
const {verifyRefreshToken} = require('../../utils/validate.token');
const statisticRepository = require('../../repositories/statistic.repository');
const questionTypeRepository = require('../../repositories/question_type.repository');
const questionRepository = require('../../repositories/question.repository');
const testRepository = require('../../repositories/test.repository');
const aptitudeTestRepository = require('../../repositories/aptitude_test.repository');
const commonFunctions = require('../../utils/common_functions');
const {logUsedTime} = require('../../repositories/statistic_used_time.repository');
const tokenList = [];

module.exports = {
    classname: 'UserAcountController',

    /**
     * Function register
     * @author    Linhhtm
     * @date      2021/12/28
     */
    register: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            const newAccount = {
                full_name: req.body.full_name,
                email: req.body.email,
                username: req.body.username,
                password: req.body.password,
                role: USER_ROLES.USER,
                birthday: req.body.birthday,
                occupation: req.body.occupation,
                address: req.body.address,
                course: req.body.course,
                class: req.body.class,
            };

            const findParams = {
                $or: [{email: req.body.email}, {username: req.body.username}],
            };
            const user = await userRepository.findByEmailOrUsername(findParams);
            if (user) {
                return handlerBadRequestError(
                    req,
                    res,
                    ErrorMessage.EMAIL_OR_USERNAME_IS_ALREADY_EXISTED,
                );
            }

            const createAccount = await userRepository.create(newAccount);

            const statisticNew = {
                user_id: createAccount._id,
                child_type: {
                    child_type_A: 0,
                    child_type_B: 0,
                    child_type_C: 0,
                    child_type_D: 0,
                    child_type_E: 0,
                    child_type_F: 0,
                },
                root_type: {
                    root_type_A: 0,
                    root_type_B: 0,
                    root_type_C: 0,
                    root_type_D: 0,
                    root_type_E: 0,
                    root_type_F: 0,
                },
            };
            await statisticRepository.create(statisticNew);

            return handlerSuccess(req, res, createAccount);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function login
     * @author    Linhhtm
     * @date      2021/11/08
     */
    login: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            const account = {
                username: req.body.username,
                password: req.body.password,
            };

            let comparePassword;
            const findParams = {
                $or: [{username: account.username}, {email: account.username}],
            };
            const user = await userRepository.findByEmailOrUsername(findParams);
            if (!user) {
                return handlerBadRequestError(
                    req,
                    res,
                    ErrorMessage.USERNAME_OR_PASSWORD_IS_INCORRECT,
                );
            }

            if (user.status === USER_STATUS.INACTIVE || user.status === USER_STATUS.SUSPEND) {
                return handlerBadRequestError(
                    req,
                    res,
                    ErrorMessage.ACOUNT_HAS_INACTIVE_AND_SUSPEND,
                );
            }

            if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.MENTOR) {
                return handlerPermissionDeniedError(req, res, ErrorMessage.PERMISSION_DENIED);
            }

            const dateNow = Date.now();
            const expired = new Date(user.expiration_date);
            if (dateNow >= expired && user.expiration_date) {
                return handlerBadRequestError(req, res, ErrorMessage.ACOUNT_HAS_EXPIRED);
            }

            await user.comparePassword(account.password).then((data) => {
                comparePassword = data;
            });

            if (!comparePassword) {
                return handlerBadRequestError(
                    req,
                    res,
                    ErrorMessage.USERNAME_OR_PASSWORD_IS_INCORRECT,
                );
            }

            const accountInfor = {
                id: user._id,
                full_name: user.full_name,
                username: user.username,
                email: user.email,
                role: user.role,
            };

            const accessToken = auth.generateAccessToken(accountInfor);
            const refreshToken = auth.generateRefreshToken({id: user._id});
            tokenList[user._id] = refreshToken;

            // update user
            await userRepository.update(user._id, {
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            return handlerSuccess(req, res, {
                infor: accountInfor,
                accessToken: accessToken,
                refreshToken: refreshToken,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function refresh token for user
     * @body      `refreshToken`
     * @output    `accessToken`
     * @author    Vudq
     * @date      2021/11/30
     */
    async refreshToken(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            const input = req.body.refreshToken;
            const userInfor = verifyRefreshToken(input);
            if (!userInfor) {
                return handlerBadRequestError(req, res, ErrorMessage.REFRESHTOKEN_IS_NOT_MATCH);
            }

            const user = await userRepository.findById(userInfor.id);
            if (!user) {
                return handlerNotFoundError(req, res, ErrorMessage.USER_IS_NOT_FOUND);
            }

            const accountInfor = {
                id: user._id,
                full_name: user.full_name,
                username: user.username,
                email: user.email,
                role: user.role,
            };

            const accessToken = auth.generateAccessToken(accountInfor);
            const refreshToken = auth.generateRefreshToken({id: user._id});
            await userRepository.update(user._id, {
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            return handlerSuccess(req, res, {
                accessToken: accessToken,
                refreshToken: refreshToken,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    async getDetailUser(req, res, next) {
        try {
            const account = await userRepository.findById(req.decoded.id);
            if (!account) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            // time using the app
            if (req.query.usage_time) {
                const time = +account.usage_time + +req.query.usage_time;
                await userRepository.update(req.decoded.id, {usage_time: time});
                // await historyUsedTimeRepository.create({
                //     used_time: req.query.usage_time,
                //     user_id: account.id,
                // });
                await logUsedTime(req);
            }
            return handlerSuccess(req, res, account);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function forgot password
     * @author    Linhhtm
     * @date      2021/11/08
     */
    async forgotPassword(req, res, next) {
        try {
            const user = await userRepository.findByEmail(req.query.email);
            if (!user) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            const verify_code = parseInt(Math.random() * 8999 + 1000);
            const transporter = nodeMailer.createTransport({
                host: 'mail9.onamae.ne.jp',
                port: 465,
                auth: {
                    user: EMAIL.ADMIN_EMAIL,
                    pass: EMAIL.ADMIN_PASSWORD,
                },
            });
            const options = {
                from: EMAIL.ADMIN_EMAIL,
                to: user.email,
                subject: 'ポケ模型パスワード変更依頼受付',
                html:
                    'パスワード変更するための認証コードをお知らせいたします。' +
                    '<br>' +
                    '４ケタの認証コード：' +
                    verify_code +
                    '<br>' +
                    '<br>' +
                    'ポケ模型４ケタの認証コード入力画面に、半角数字で入力してください。' +
                    '<br>' +
                    '<br>' +
                    '※認証コードは本人確認のための一時的な数字です。パスワードではありません。' +
                    '<br>' +
                    '※本メール にお心当たりのない方は破棄していただきますようお願い致します。' +
                    '<br>' +
                    '<br>' +
                    'お問い合わせ' +
                    '<br>' +
                    'ポケ模型運営事務局' +
                    '<br>' +
                    'TECH Planning合同会社　pokemoke@techplan.net',
            };

            // update code
            await userRepository.update(user._id, {code: verify_code});
            transporter.sendMail(options);
            return handlerSuccess(req, res, ErrorMessage.SEND_EMAIL_SUCCESS);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function reset password
     * @author    Linhhtm
     * @date      2021/10/05
     */
    async resetPassword(req, res, next) {
        try {
            const user = await userRepository.findByEmail(req.body.email);
            if (!user) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            const data = getUpdateBodysResetPassword(req.body);
            if (data.errors.length > 0) {
                return handlerBadRequestError(req, res, data.errors.join(', '));
            }

            if (req.body.password) {
                const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
                data.updateBodys.password = await bcrypt.hash(data.updateBodys.password, salt);
            }

            const update = await userRepository.update(user.id, {
                password: data.updateBodys.password,
            });
            if (!update) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            return handlerSuccess(req, res, update);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function update user
     * @author    Linhhtm
     * @date      2021/11/10
     */
    async updateUser(req, res, next) {
        try {
            const account = await userRepository.findById(req.decoded.id);
            if (!account) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            const data = req.body;
            const user = await userRepository.findByUsername(data.username);
            if (user && JSON.stringify(user._id) !== JSON.stringify(req.decoded.id)) {
                return handlerBadRequestError(req, res, ErrorMessage.USERNAME_IS_ALREADY_EXISTED);
            }

            const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
            const newPass = await bcrypt.hash(data.password, salt);

            const update = await userRepository.update(req.decoded.id, {
                username: data.username,
                password: newPass,
            });

            // time using the app
            if (req.query.usage_time) {
                const time = +account.usage_time + +req.query.usage_time;
                await userRepository.update(req.decoded.id, {usage_time: time});
                // await historyUsedTimeRepository.create({
                //     used_time: req.query.usage_time,
                //     user_id: account.id,
                // });
                await logUsedTime(req);
            }

            if (!update) {
                return handlerBadRequestError(req, res, ErrorMessage.ACCOUNT_IS_NOT_UPDATED);
            }

            return handlerSuccess(req, res, {
                id: update._id,
                full_name: update.full_name,
                email: update.email,
                username: update.username,
                role: update.role,
                personal_id: update.personal_id,
                hightest_score: update.hightest_score,
                expiration_date: update.expiration_date,
                created_at: update.created_at,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function mypage user
     * @author    Linhhtm
     * @date      2021/12/03
     */
    getExamResult: async (req, res, next) => {
        try {
            const account = await userRepository.findById(req.decoded.id);
            if (!account) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            const statistic = await statisticRepository.findByUserId(req.decoded.id);
            const question_types = await questionTypeRepository.getQuestionTypeAllSortBySymbol({
                parent_id: null,
                status: QUESTION_TYPE_STATUS.ACTIVE,
            });
            const result = {};
            result.name = account.full_name;
            result.personal_id = account.personal_id;

            if (statistic) {
                result.character_root_type = await getCharacterRootType(
                    question_types,
                    statistic?.root_type,
                    req.decoded.id,
                );

                result.character_child_type = await getCharacterChildType(
                    question_types,
                    statistic.child_type,
                );
                // rank
                result.rank = statistic.rank;
            }

            // result aptitude test
            const aptitude_test = await aptitudeTestRepository.findByUserId(req.decoded.id);
            result.aptitude_test = aptitude_test;

            // time using the app
            if (req.query.usage_time) {
                const time = +account.usage_time + +req.query.usage_time;
                await userRepository.update(req.decoded.id, {usage_time: time});
                // await historyUsedTimeRepository.create({
                //     used_time: req.query.usage_time,
                //     user_id: account.id,
                // });
                await logUsedTime(req);
            }

            return handlerSuccess(req, res, result);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function verify code
     * @author    Linhhtm
     * @date      2021/12/10
     */
    verifyCode: async (req, res, next) => {
        try {
            const user = await userRepository.findByCode(req.query.code);
            if (!user) {
                return handlerBadRequestError(req, res, ErrorMessage.CODE_IS_NOT_CORRECT);
            }
            return handlerSuccess(req, res, user);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function change password
     * @author    Linhhtm
     * @date      2021/10/05
     */
    async changePassword(req, res, next) {
        try {
            const user = await userRepository.findByEmail(req.decoded.email);
            if (!user) {
                return handlerBadRequestError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            const data = getUpdateBodysChangePassword(req.body);
            if (data.errors.length > 0) {
                return handlerBadRequestError(req, res, data.errors.join(', '));
            }

            if (data.updateBodys.password) {
                let comparePassword;
                await user.comparePassword(data.updateBodys.old_password).then((data) => {
                    comparePassword = data;
                });

                if (!comparePassword) {
                    return handlerBadRequestError(req, res, ErrorMessage.OLD_PASSWORD_IS_INCORRECT);
                }

                const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
                const newPass = await bcrypt.hash(data.updateBodys.password, salt);
                data.updateBodys.password = newPass;
            }

            // time using the app
            if (req.query.usage_time) {
                const time = +user.usage_time + +req.query.usage_time;
                await userRepository.update(req.decoded.id, {usage_time: time});
                // await historyUsedTimeRepository.create({
                //     used_time: req.query.usage_time,
                //     user_id: user.id,
                // });
                await logUsedTime(req);
            }

            const update = await userRepository.update(user.id, {
                password: data.updateBodys.password,
            });
            if (!update) {
                return handlerBadRequestError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            return handlerSuccess(req, res, {
                id: update._id,
                full_name: update.full_name,
                email: update.email,
                username: update.username,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function update username
     * @author    Linhhtm
     * @date      2021/10/05
     */
    async updateUsername(req, res, next) {
        try {
            const account = await userRepository.findById(req.decoded.id);
            if (!account) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            const user = await userRepository.findByUsername(req.query.username);
            if (user && JSON.stringify(user._id) !== JSON.stringify(req.decoded.id)) {
                return handlerBadRequestError(req, res, ErrorMessage.USERNAME_IS_ALREADY_EXISTED);
            }

            const update = await userRepository.update(req.decoded.id, {
                username: req.query.username,
            });

            // time using the app
            if (req.query.usage_time) {
                const time = +account.usage_time + +req.query.usage_time;
                await userRepository.update(req.decoded.id, {usage_time: time});
                // await historyUsedTimeRepository.create({
                //     used_time: req.query.usage_time,
                //     user_id: account.id,
                // });
                await logUsedTime(req);
            }

            if (!update) {
                return handlerBadRequestError(req, res, ErrorMessage.ACCOUNT_IS_NOT_UPDATED);
            }

            return handlerSuccess(req, res, {
                id: update._id,
                full_name: update.full_name,
                email: update.email,
                username: update.username,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },
};

async function getCharacterRootType(question_types, root_type, user_id) {
    const character_root_type = [];
    if (question_types) {
        for (let i = 0; i < Object.keys(question_types).length; i++) {
            const itemName = Object.keys(question_types)[i];
            const itemValue = question_types[itemName]._id;
            const number_question = await questionRepository.count({
                root_type: itemValue,
                status: QUESTION_STATUS.ACTIVE,
            });
            const test = await testRepository.getTest({
                user_id: user_id,
                root_type: itemValue,
                score: {$exists: true},
            });
            let date = null;

            if (test) {
                date = test.created_at;
            }
            character_root_type.push({
                name: !question_types[itemName].name ? null : question_types[itemName].name,
                rank: commonFunctions.getRank(
                    root_type['root_type_' + question_types[itemName].symbol],
                    number_question,
                ),
                date,
            });
        }
    }
    return character_root_type;
}

async function getCharacterChildType(root_types, correct_answers) {
    const character_child_type = [
        {
            name: '骨名称',
            correct_answer: correct_answers.child_type_A,
            number_question: 0,
        },
        {
            name: '骨ランドマーク',
            correct_answer: correct_answers.child_type_B,
            number_question: 0,
        },
        {
            name: '筋肉名称',
            correct_answer: correct_answers.child_type_C,
            number_question: 0,
        },
        {
            name: '筋肉起始停止',
            correct_answer: correct_answers.child_type_D,
            number_question: 0,
        },
        {
            name: '筋肉機能',
            correct_answer: correct_answers.child_type_E,
            number_question: 0,
        },
        {
            name: '動き名称',
            correct_answer: correct_answers.child_type_F,
            number_question: 0,
        },
    ];

    if (root_types) {
        const question_type_ids = Object.keys(root_types).map(function (key) {
            return root_types[key]._id;
        });
        const child_types = await questionTypeRepository.getQuestionTypeAllSortBySymbol({
            parent_id: {$in: question_type_ids},
            status: QUESTION_TYPE_STATUS.ACTIVE,
        });

        // get id of each question type
        const child_type_ids = {A: [], B: [], C: [], D: [], E: [], F: []};
        for (let i = 0; i < Object.keys(child_types).length; i++) {
            const itemName = Object.keys(child_types)[i];
            const itemValue = child_types[itemName].symbol;
            child_type_ids[itemValue].push(child_types[itemName]._id);
        }
        // count number question for question type
        character_child_type[0].number_question = await questionRepository.count({
            child_type: {$in: child_type_ids['A']},
            status: QUESTION_STATUS.ACTIVE,
        });
        character_child_type[1].number_question = await questionRepository.count({
            child_type: {$in: child_type_ids['B']},
            status: QUESTION_STATUS.ACTIVE,
        });
        character_child_type[2].number_question = await questionRepository.count({
            child_type: {$in: child_type_ids['C']},
            status: QUESTION_STATUS.ACTIVE,
        });
        character_child_type[3].number_question = await questionRepository.count({
            child_type: {$in: child_type_ids['D']},
            status: QUESTION_STATUS.ACTIVE,
        });
        character_child_type[4].number_question = await questionRepository.count({
            child_type: {$in: child_type_ids['E']},
            status: QUESTION_STATUS.ACTIVE,
        });
        character_child_type[5].number_question = await questionRepository.count({
            child_type: {$in: child_type_ids['F']},
            status: QUESTION_STATUS.ACTIVE,
        });
    }
    return character_child_type;
}

function getUpdateBodysResetPassword(updates) {
    const updateBodys = {};
    const errors = [];

    if (updates.email) {
        updateBodys.email = updates.email;
    }

    if (updates.password) {
        updateBodys.password = updates.password;
    }

    return {updateBodys: updateBodys, errors: errors};
}

function getUpdateBodysChangePassword(updates) {
    const updateBodys = {};
    const errors = [];

    if (updates.password) {
        if (!updates.old_password) {
            errors.push(ErrorMessage.OLD_PASSWORD_IS_REQUIRE);
        }

        updateBodys.old_password = updates.old_password;
        updateBodys.password = updates.password;
    }

    return {updateBodys: updateBodys, errors: errors};
}
