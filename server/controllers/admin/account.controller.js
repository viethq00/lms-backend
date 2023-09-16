const userRepository = require('../../repositories/user.repository');
const {validationResult} = require('express-validator');
const ErrorMessage = require('../../utils/errorMessage').ErrorMessage;
const auth = require('../../utils/validate.token');
const {
    _errorFormatter,
    addMongooseParam,
    getHeaders,
    checkExistedUser,
} = require('../../utils/helper');
const logger = require('../../utils/logger');
const {
    USER_STATUS,
    USER_ROLES,
    URL_BASE,
    URL_USER_FORM,
    QUESTION_TYPE_STATUS,
    QUESTION_STATUS,
    FIELD_CSV,
} = require('../../utils/consts');

const statisticRepository = require('../../repositories/statistic.repository');
const questionTypeRepository = require('../../repositories/question_type.repository');
const questionRepository = require('../../repositories/question.repository');
const testRepository = require('../../repositories/test.repository');
const aptitudeTestRepository = require('../../repositories/aptitude_test.repository');
const feedbackRepository = require('../../repositories/feedback.repository');
const answerRepository = require('../../repositories/answer.repository');
const educationRepository = require('../../repositories/education.repository');
const historyRankingRepo = require('../../repositories/history_ranking.repository');
const uploadExcelRepository = require('../../repositories/upload_excel.repository');
const commonFunctions = require('../../utils/common_functions');
const ObjectID = require('mongodb').ObjectID;
const excelJS = require('exceljs');
const {HEADERS_EXPORT_USER_CSV} = require('../../utils/consts');
const {
    handlerSuccess,
    handlerBadRequestError,
    handlerNotFoundError,
    handlerPermissionDeniedError,
} = require('../../utils/handler.response');
const {verifyRefreshToken} = require('../../utils/validate.token');
const moment = require('moment');
const momentTz = require('moment-timezone');
const {Parser} = require('json2csv');
const fs = require('fs');
const path = require('path');
const statisticUsedTimeRepository = require('../../repositories/statistic_used_time.repository');

module.exports = {
    classname: 'AdminAcountController',

    createdUser: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            const newAccount = {
                full_name: req.body.full_name,
                email: req.body.email,
                role: req.body.role,
                expiration_date: req.body.expiration_date,
                schools: req.body.schools,
                faculty: req.body.faculty,
                education_id: req.body.education_id,
            };

            const education_schools = await educationRepository.getEducation(req.body.schools);
            const education_faculty = await educationRepository.getEducation(req.body.faculty);
            const education_year = await educationRepository.getEducation(req.body.education_id);
            if (education_schools) {
                if (education_faculty) {
                    if (education_year) {
                        newAccount.personal_id =
                            education_schools.code +
                            '-' +
                            education_faculty.code +
                            education_year.code +
                            req.body.personal_id;
                        newAccount.password =
                            education_schools.code +
                            '-' +
                            education_faculty.code +
                            education_year.code +
                            req.body.personal_id;
                    } else {
                        return handlerNotFoundError(req, res, ErrorMessage.EDUCATION_IS_NOT_FOUND);
                    }
                } else {
                    return handlerNotFoundError(req, res, ErrorMessage.EDUCATION_IS_NOT_FOUND);
                }
            } else {
                return handlerNotFoundError(req, res, ErrorMessage.EDUCATION_IS_NOT_FOUND);
            }

            const findParams = {
                $or: [{email: req.body.email}, {personal_id: newAccount.personal_id}],
            };
            const user = await userRepository.findByEmailOrUsername(findParams);
            if (user) {
                return handlerBadRequestError(
                    req,
                    res,
                    ErrorMessage.EMAIL_OR_PERSONALID_IS_ALREADY_EXISTED,
                );
            }

            if (newAccount.role === USER_ROLES.ADMIN) {
                return handlerBadRequestError(req, res, ErrorMessage.USER_ROLE_IS_NOT_MATCH);
            }

            const createAccount = await userRepository.create(newAccount);

            if (createAccount.role === USER_ROLES.USER) {
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
            }

            return handlerSuccess(req, res, createAccount);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function create acount mentor
     * @author    Linhhtm
     * @date      2021/12/16
     */
    createdMentor: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            const newAccount = {
                full_name: req.body.full_name,
                email: req.body.email,
                password: req.body.password,
                username: req.body.username,
                role: req.body.role,
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

            if (newAccount.role === USER_ROLES.ADMIN) {
                return handlerBadRequestError(req, res, ErrorMessage.USER_ROLE_IS_NOT_MATCH);
            }

            const createAccount = await userRepository.create(newAccount);
            return handlerSuccess(req, res, createAccount);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function create acount teacher
     * @author    vudq
     * @date      2022/06/24
     */
    createdTeacher: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            const schoolId = req.body.school_id;
            if (!ObjectID.isValid(schoolId)) {
                return handlerBadRequestError(req, res, '学校IDパラメータがありません');
            }

            const schools = await educationRepository.getEducation(schoolId);
            if (!schools) {
                return handlerBadRequestError(req, res, ErrorMessage.SCHOOL_ID_IS_NOT_MATCH);
            }

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

            const newAccount = {
                full_name: req.body.full_name,
                email: req.body.email,
                password: req.body.password,
                username: req.body.username,
                role: USER_ROLES.TEACHER,
                schools: schools._id,
            };

            const createAccount = await userRepository.create(newAccount);
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
                email: req.body.email,
                password: req.body.password,
            };
            let comparePassword;
            const user = await userRepository.findByEmail(account.email);
            if (!user) {
                return handlerBadRequestError(req, res, ErrorMessage.EMAIL_IS_INCORRECT);
            }

            if (user.status === USER_STATUS.INACTIVE || user.status === USER_STATUS.SUSPEND) {
                return handlerBadRequestError(
                    req,
                    res,
                    ErrorMessage.ACOUNT_HAS_INACTIVE_AND_SUSPEND,
                );
            }

            if (user.role === USER_ROLES.USER) {
                return handlerPermissionDeniedError(req, res, ErrorMessage.PERMISSION_DENIED);
            }

            await user.comparePassword(account.password).then((data) => {
                comparePassword = data;
            });

            if (!comparePassword) {
                return handlerBadRequestError(req, res, ErrorMessage.PASSWORD_IS_INCORRECT);
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
            // tokenList[user._id] = refreshToken;

            await userRepository.update(user._id, {
                refresh_token: refreshToken,
                access_token: accessToken,
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
     * Function refresh token for admin
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

    /**
     * Function list user
     * @author    Linhhtm
     * @date      2021/11/09
     */
    async indexAccounts(req, res, next) {
        try {
            const findParams = getFindParams(req.query);
            const page = +req.query.page || 1;
            const perPage = +req.query.limit || 20;

            const count = await userRepository.count(findParams);
            const responseHeaders = getHeaders(count, page, perPage);

            const accounts = await userRepository.findAll(findParams, {
                page,
                perPage,
            });

            const result = [];
            if (req.query.role === USER_ROLES.USER) {
                for (let i = 0; i < accounts.length; i++) {
                    const statistic = await statisticRepository.findByUserId(accounts[i]._id);
                    const account = {
                        _id: accounts[i]._id,
                        email: accounts[i].email,
                        full_name: accounts[i].full_name,
                        username: accounts[i].username,
                        personal_id: accounts[i].personal_id,
                        usage_time: accounts[i].usage_time,
                        rank: statistic.rank || null,
                        question_type_main: await getNumberTestsByUserId(accounts[i]._id),
                        hightest_score: accounts[i].hightest_score,
                        expiration_date: accounts[i].expiration_date,
                        created_at: accounts[i].created_at,
                        status: accounts[i].status,
                        role: accounts[i].role,
                        schools: accounts[i].schools,
                        faculty: accounts[i].faculty,
                        education_id: accounts[i].education_id,
                    };
                    result.push(account);
                }
            }

            return handlerSuccess(req, res, {
                items: req.query.role === USER_ROLES.USER ? result : accounts,
                headers: responseHeaders,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    async downloadCsvAccounts(req, res, next) {
        try {
            if (!req.query.schools || !ObjectID.isValid(req.query.schools)) {
                return handlerBadRequestError(
                    req,
                    res,
                    'Missing params call api or not match ObjectId',
                );
            }
            const findParams = getFilterCsvParams(req.query);
            let fileName = '';
            const currentDate = momentTz.tz(Date.now(), 'Japan').format('YYYYMMDD');
            if (findParams.schools) {
                const schools = await educationRepository.getEducation(findParams.schools);
                if (!schools) {
                    return handlerBadRequestError(req, res, ErrorMessage.SCHOOL_ID_IS_NOT_MATCH);
                }
                fileName = fileName + `${schools.name}`;
            }

            if (findParams.faculty) {
                const faculty = await educationRepository.getEducation(findParams.faculty);
                if (!faculty) {
                    return handlerBadRequestError(req, res, ErrorMessage.FACULTY_ID_IS_NOT_MATCH);
                }
                fileName = fileName + `_${faculty.name}`;
            }

            if (findParams.education_id) {
                const education = await educationRepository.getEducation(findParams.education_id);
                if (!education) {
                    return handlerBadRequestError(req, res, ErrorMessage.EDUCATION_ID_IS_NOT_MATCH);
                }
                fileName = fileName + `_${education.name}`;
            }

            fileName = fileName + `_${currentDate}`;

            findParams.status = {$in: [1, 2]};
            const accounts = await userRepository.findAllCSV(findParams);
            if (!accounts || accounts.length <= 0) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }
            const ids = accounts.map((item) => {
                return item._id;
            });

            const countTests = await testRepository.countScoreByUserIds(ids);
            // const countTests = await getNumberTestStatistic(ids);

            const results = [];
            const rootType = await questionTypeRepository.getRootType();
            if (!rootType || rootType.length <= 0) {
                return handlerNotFoundError(req, res, ErrorMessage.QUESTION_TYPE_NOT_FOUND);
            }

            const {
                A,
                B,
                C,
                D,
                E,
                F,
                NumberTestA,
                NumberTestAptitude,
                NumberTestB,
                NumberTestC,
                NumberTestD,
                NumberTestE,
                NumberTestF,
                RankAverage,
                HighScore,
                TimeUsed,
                Name,
                PersonalID,
                CountTest,
                ExpirationDate,
            } = FIELD_CSV;
            const listRootType = sortQuestionType(rootType);

            const rankList = await getRankUsersNew(ids, listRootType);

            const countTestDetails = await testRepository.countByUserIdsAndRootType({
                user_id: {
                    $in: ids
                },
                root_type: {
                    $in: listRootType
                },
                score: {$exists: true},
            });

            const countAptitudeTests = await aptitudeTestRepository.countNew({
                user_id: {
                    $in: ids
                },
                score: {$exists: true},
            });

            for (let i = 0; i < accounts.length; i++) {
                const item = accounts[i];;

                const countAptitudeTest = countAptitudeTests.find(itemAptitudeTest =>  itemAptitudeTest._id?.toString() === item._id?.toString());

                const countTestDetailByUser = countTestDetails.filter(itemCountTestDetail =>
                    itemCountTestDetail?._id?.user_id?.toString() === item._id?.toString()
                );

                const countTest = getCountTestWithUserId(item._id, countTests);
                const statistic = rankList[i]?.statistic || ['D', 'D', 'D', 'D', 'D', 'D'];
                const account = {
                    id: item._id,
                };
                account[Name] = item.full_name;
                account[PersonalID] = item.personal_id;
                account[TimeUsed] = item.usage_time;
                account[HighScore] = item.hightest_score || 0;
                account[CountTest] = countTest;
                account[RankAverage] = rankList[i]?.rank || null;
                account[A] = statistic[0];
                account[B] = statistic[1];
                account[C] = statistic[2];
                account[D] = statistic[3];
                account[E] = statistic[4];
                account[F] = statistic[5];
                account[NumberTestA] = findNumberTestBySymbolQuestion(countTestDetailByUser, "A");
                account[NumberTestB] = findNumberTestBySymbolQuestion(countTestDetailByUser, "B");
                account[NumberTestC] = findNumberTestBySymbolQuestion(countTestDetailByUser, "C")
                account[NumberTestD] = findNumberTestBySymbolQuestion(countTestDetailByUser, "D")
                account[NumberTestE] = findNumberTestBySymbolQuestion(countTestDetailByUser, "E")
                account[NumberTestF] = findNumberTestBySymbolQuestion(countTestDetailByUser, "F")
                account[NumberTestAptitude] = countAptitudeTest?.count || 0;
                account[ExpirationDate] = item.expiration_date;

                results.push(account);
            }

            if (results.length < 0 || results.length === 0) {
                return handlerSuccess(req, res, ErrorMessage.NO_USER_TO_EXPORT);
            }

            const pwd = path.join(__dirname, '../../uploads/export');
            const url = `${fileName}.csv`;
            const pathDownload = pwd + '/' + url;

            if (!fs.existsSync(pwd)) {
                fs.mkdirSync(pwd);
            }

            const parser = new Parser({HEADERS_EXPORT_USER_CSV});
            const content = parser.parse(results);

            await fs.writeFileSync(pathDownload, content, function (err) {
                if (err) {
                    return res.status(400).json({success: false, message: 'An error occurred'});
                }
            });

            return handlerSuccess(req, res, URL_BASE + 'export/' + url);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    async downloadCsvAccountsOld(req, res, next) {
        try {
            if (!req.query.schools || !ObjectID.isValid(req.query.schools)) {
                return handlerBadRequestError(
                    req,
                    res,
                    'Missing params call api or not match ObjectId',
                );
            }
            const findParams = getFilterCsvParams(req.query);
            let fileName = '';
            const currentDate = momentTz.tz(Date.now(), 'Japan').format('YYYYMMDD');
            if (findParams.schools) {
                const schools = await educationRepository.getEducation(findParams.schools);
                if (!schools) {
                    return handlerBadRequestError(req, res, ErrorMessage.SCHOOL_ID_IS_NOT_MATCH);
                }
                fileName = fileName + `${schools.name}`;
            }

            if (findParams.faculty) {
                const faculty = await educationRepository.getEducation(findParams.faculty);
                if (!faculty) {
                    return handlerBadRequestError(req, res, ErrorMessage.FACULTY_ID_IS_NOT_MATCH);
                }
                fileName = fileName + `_${faculty.name}`;
            }

            if (findParams.education_id) {
                const education = await educationRepository.getEducation(findParams.education_id);
                if (!education) {
                    return handlerBadRequestError(req, res, ErrorMessage.EDUCATION_ID_IS_NOT_MATCH);
                }
                fileName = fileName + `_${education.name}`;
            }

            fileName = fileName + `_${currentDate}`;

            findParams.status = {$in: [1, 2]};
            const accounts = await userRepository.findAllCSV(findParams);
            if (!accounts || accounts.length <= 0) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }
            const ids = accounts.map((item) => {
                return item._id;
            });

            const countTests = await getNumberTestStatistic(ids);
            const results = [];
            const rootType = await questionTypeRepository.getRootType();
            if (!rootType || rootType.length <= 0) {
                return handlerNotFoundError(req, res, ErrorMessage.QUESTION_TYPE_NOT_FOUND);
            }
            const {
                A,
                B,
                C,
                D,
                E,
                F,
                NumberTestA,
                NumberTestAptitude,
                NumberTestB,
                NumberTestC,
                NumberTestD,
                NumberTestE,
                NumberTestF,
                RankAverage,
                HighScore,
                TimeUsed,
                Name,
                PersonalID,
                CountTest,
                ExpirationDate,
            } = FIELD_CSV;
            const listRootType = sortQuestionType(rootType);
            const rankList = await getRankUsers(ids, listRootType);

            for (let i = 0; i < accounts.length; i++) {
                const item = accounts[i];
                const countAptitudeTest = await aptitudeTestRepository.count({
                    user_id: item._id,
                    score: {$exists: true},
                });
                const countTestDetail = (await getCountTest(item._id, listRootType)) || [
                    0, 0, 0, 0, 0, 0,
                ];
                const countTest = getCountTestWithUserId(item._id, countTests);
                const statistic = rankList[i]?.statistic || ['D', 'D', 'D', 'D', 'D', 'D'];
                const account = {
                    id: item._id,
                };
                account[Name] = item.full_name;
                account[PersonalID] = item.personal_id;
                account[TimeUsed] = item.usage_time;
                account[HighScore] = item.hightest_score || 0;
                account[CountTest] = countTest;
                account[RankAverage] = rankList[i]?.rank || null;
                account[A] = statistic[0];
                account[B] = statistic[1];
                account[C] = statistic[2];
                account[D] = statistic[3];
                account[E] = statistic[4];
                account[F] = statistic[5];
                account[NumberTestA] = countTestDetail[0];
                account[NumberTestB] = countTestDetail[1];
                account[NumberTestC] = countTestDetail[2];
                account[NumberTestD] = countTestDetail[3];
                account[NumberTestE] = countTestDetail[4];
                account[NumberTestF] = countTestDetail[5];
                account[NumberTestAptitude] = countAptitudeTest || 0;
                account[ExpirationDate] = item.expiration_date;

                results.push(account);
            }

            if (results.length < 0 || results.length === 0) {
                return handlerSuccess(req, res, ErrorMessage.NO_USER_TO_EXPORT);
            }

            const pwd = path.join(__dirname, '../../uploads/export');
            const url = `${fileName}.csv`;
            const pathDownload = pwd + '/' + url;

            if (!fs.existsSync(pwd)) {
                fs.mkdirSync(pwd);
            }

            const parser = new Parser({HEADERS_EXPORT_USER_CSV});
            const content = parser.parse(results);

            await fs.writeFileSync(pathDownload, content, function (err) {
                if (err) {
                    return res.status(400).json({success: false, message: 'An error occurred'});
                }
            });

            return handlerSuccess(req, res, URL_BASE + 'export/' + url);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    async getDetailUser(req, res, next) {
        try {
            const account = await userRepository.findById(req.params.id);
            if (!account) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            const statistic = await statisticRepository.findByUserId(req.params.id);
            const question_types = await questionTypeRepository.getQuestionTypeAllSortBySymbol({
                parent_id: null,
                status: QUESTION_TYPE_STATUS.ACTIVE,
            });

            const user = {};
            if (account.role === USER_ROLES.USER) {
                user.id = account._id;
                user.full_name = account.full_name;
                user.email = account.email;
                user.username = account.username;
                user.role = account.role;
                user.personal_id = account.personal_id;
                user.hightest_score = account.hightest_score;
                user.usage_time = account.usage_time;
                user.expiration_date = account.expiration_date;
                user.created_at = account.created_at;
                user.schools = account.schools;
                user.faculty = account.faculty;
                user.education_id = account.education_id;
                user.character_root_type = await getCharacterRootType(
                    question_types,
                    statistic.root_type,
                    req.params.id,
                );
                user.character_child_type = await getCharacterChildType(
                    question_types,
                    statistic.child_type,
                );
                user.rank = statistic.rank;
                user.date_rank = statistic.date_rank;
                user.aptitude_test = await aptitudeTestRepository.getAptitudeTests({
                    user_id: req.params.id,
                    spend_times: {$ne: null},
                    score: {$ne: null},
                });
                user.number_test = await testRepository.count({
                    user_id: req.params.id,
                    score: {$ne: null},
                });
            } else {
                user.id = account._id;
                user.full_name = account.full_name;
                user.email = account.email;
                user.username = account.username;
                user.role = account.role;
                user.created_at = account.created_at;
            }

            return handlerSuccess(req, res, user);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function update user
     * @author    Linhhtm
     * @date      2021/11/08
     */
    async updateUser(req, res, next) {
        try {
            const account = await userRepository.findById(req.params.id);
            if (!account) {
                return handlerBadRequestError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            if (account.status === USER_STATUS.SUSPEND) {
                return handlerBadRequestError(req, res, ErrorMessage.ACCOUNT_IS_NOT_UPDATED);
            } else {
                const data = await getUpdateBodys(req.body);
                const education_schools = await educationRepository.getEducation(req.body.schools);
                const education_faculty = await educationRepository.getEducation(req.body.faculty);
                const education_year = await educationRepository.getEducation(
                    req.body.education_id,
                );
                if (education_schools) {
                    if (education_faculty) {
                        if (education_year) {
                            data.updateBodys.personal_id =
                                education_schools.code +
                                '-' +
                                education_faculty.code +
                                education_year.code +
                                req.body.personal_id;
                        } else {
                            return handlerNotFoundError(
                                req,
                                res,
                                ErrorMessage.EDUCATION_IS_NOT_FOUND,
                            );
                        }
                    } else {
                        return handlerNotFoundError(req, res, ErrorMessage.EDUCATION_IS_NOT_FOUND);
                    }
                } else {
                    return handlerNotFoundError(req, res, ErrorMessage.EDUCATION_IS_NOT_FOUND);
                }
                const findParams = {
                    $or: [
                        {
                            email:
                                data.updateBodys.email === account.email
                                    ? ''
                                    : data.updateBodys.email,
                        },
                        {
                            personal_id:
                                data.updateBodys.personal_id === account.personal_id
                                    ? ''
                                    : data.updateBodys.personal_id,
                        },
                    ],
                };
                const user = await userRepository.findByEmailOrUsername(findParams);
                if (user && JSON.stringify(user._id) !== JSON.stringify(req.params.id)) {
                    return handlerBadRequestError(
                        req,
                        res,
                        ErrorMessage.EMAIL_OR_PERSONALID_IS_ALREADY_EXISTED,
                    );
                }

                if (data.errors.length > 0) {
                    return handlerBadRequestError(req, res, data.errors.join(', '));
                }

                const update = await userRepository.update(req.params.id, data.updateBodys);
                if (!update) {
                    return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_UPDATED);
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
                    schools: update.schools,
                    faculty: update.faculty,
                    education_id: update.education_id,
                });
            }
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function update acount mentor
     * @author    Linhhtm
     * @date      2021/11/16
     */
    async updateMentor(req, res, next) {
        try {
            const account = await userRepository.findById(req.params.id);
            if (!account) {
                return handlerBadRequestError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            if (account.status === USER_STATUS.SUSPEND) {
                return handlerBadRequestError(req, res, ErrorMessage.ACCOUNT_IS_NOT_UPDATED);
            } else {
                const data = await getUpdateMentorBodys(req.body);
                const user = await userRepository.findByEmail(data.updateBodys.email);
                if (user && JSON.stringify(user._id) !== JSON.stringify(req.params.id)) {
                    return handlerBadRequestError(req, res, ErrorMessage.EMAIL_IS_EXISTED);
                }

                if (data.errors.length > 0) {
                    return handlerBadRequestError(req, res, data.errors.join(', '));
                }

                const update = await userRepository.update(req.params.id, data.updateBodys);
                if (!update) {
                    return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_UPDATED);
                }

                return handlerSuccess(req, res, {
                    id: update._id,
                    full_name: update.full_name,
                    email: update.email,
                    username: update.username,
                    role: update.role,
                    created_at: update.created_at,
                });
            }
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function delete user
     * @author    Linhhtm
     * @date      2021/11/10
     */
    async deleteUsers(req, res, next) {
        try {
            const user_ids = req.body;

            user_ids.forEach((item) => {
                if (ObjectID.isValid(item) === false) {
                    return handlerBadRequestError(req, res, `Id '${item}' is not ObjectId`);
                }
            });

            const errorIds = await checkExistedUser(userRepository, user_ids);
            if (errorIds.length > 0) {
                return handlerBadRequestError(
                    req,
                    res,
                    `Ids '${errorIds.join(', ')}' is not found!`,
                );
            }
            const deleteUsers = await userRepository.deleteMany(user_ids);

            // delete feedbacks
            await feedbackRepository.deleteManyByUserIds(user_ids);

            // delete test
            await testRepository.deleteManyByUserIds(user_ids);
            await aptitudeTestRepository.deleteManyByUserIds(user_ids);

            // delete answer
            await answerRepository.deleteManyByUserIds(user_ids);

            // delete statistic
            await statisticRepository.deleteManyByUserIds(user_ids);

            return handlerSuccess(req, res, deleteUsers);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function update status user
     * @author    Linhhtm
     * @date      2021/11/15
     */
    async updateStatus(req, res, next) {
        try {
            if (!req.query.id) {
                return handlerBadRequestError(req, res, ErrorMessage.MISSING_USER_ID_PARAMETER);
            }

            if (!req.query.status) {
                return handlerBadRequestError(req, res, ErrorMessage.MISSING_STATUS_PARAMETER);
            }

            const account = await userRepository.findById(req.query.id);
            if (!account) {
                return handlerBadRequestError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            if (req.query.status === USER_STATUS.SUSPEND) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_EXISTED);
            } else {
                const status = {status: req.query.status};
                const updateStatus = await userRepository.update(req.query.id, status);
                return handlerSuccess(req, res, updateStatus);
            }
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function import user from excel
     * @author    Linhhtm
     * @date      2021/11/16
     */
    importUserFromExcel: async (req, res, next) => {
        try {
            const errors = validationResult(req);
            // response status code 200 even if error
            if (!errors.isEmpty()) {
                const errorMsg = module.exports._errorFormatter(errors.array());
                return handlerBadRequestError(req, res, errorMsg);
            }
            //upload file
            await uploadExcelRepository(req, res);
            // import file
            const userRow = [];
            const fileName = req.file.originalname;
            const workbook = new excelJS.Workbook();
            await workbook.xlsx
                .readFile(process.cwd() + '/uploads/file_import/' + fileName)
                .then(async function () {
                    // use workbook
                    const worksheet = workbook.getWorksheet();
                    worksheet.spliceRows(0, 2);
                    await worksheet.eachRow({includeEmpty: false}, async function (row) {
                        const user = {
                            id: row.getCell(1).value || null,
                            name: row.getCell(2).text.trim() || null,
                            personalId: row.getCell(3).text.trim() || null,
                            email: row.getCell(4).text.trim() || null,
                            expirationAt: row.getCell(5).value || null,
                        };
                        userRow.push(user);
                    });
                })
                .catch(() => {
                    return handlerBadRequestError(
                        null,
                        res,
                        ErrorMessage.FORMAT_EXCEL_IS_INCORRECT,
                    );
                });
            const result = await userRepository.importUserFromExcel(userRow);
            if (result.userNotImport.length > 0) {
                const fileNotImport = 'user_not_import';
                const pwd = path.join(__dirname, '../../uploads/import_error');
                const url = `${fileNotImport}.csv`;
                const pathDownload = pwd + '/' + url;
                if (!fs.existsSync(pwd)) {
                    fs.mkdirSync(pwd);
                }
                const parser = new Parser({HEADERS_EXPORT_USER_CSV});
                const content = parser.parse(result.userNotImport);

                await fs.writeFileSync(pathDownload, content, function (err) {
                    if (err) {
                        return res.status(400).json({success: false, message: 'An error occurred'});
                    }
                });

                const message =
                    result.userImport +
                    '/' +
                    userRow.length +
                    ' 人のユーザーのインポートに成功しました。';

                return res.status(400).send({
                    data: URL_BASE + 'import_error/' + url,
                    message: message,
                });
            }

            return handlerSuccess(req, res, ErrorMessage.IMPORT_EXCEL_IS_SUCCESS);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function download user example file to import user
     * @author    Linhhtm
     * @date      2021/11/17
     */
    async download(req, res, next) {
        try {
            const fileExists = commonFunctions.checkFileExists('user_sample_data.xlsx');
            if (!fileExists) {
                return handlerBadRequestError(req, res, ErrorMessage.FILE_IS_NOT_EXISTED);
            }
            return handlerSuccess(req, res, URL_BASE + URL_USER_FORM);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function dashboard
     * @author    Linhhtm
     * @date      2021/12/21
     */
    async dashboard(req, res, next) {
        try {
            const result = {
                number_users: await userRepository.count({status: USER_STATUS.ACTIVE}),
                number_questions: await questionRepository.count({status: QUESTION_STATUS.ACTIVE}),
                number_question_categorys: await questionTypeRepository.count({
                    status: QUESTION_TYPE_STATUS.ACTIVE,
                }),
                number_feedbacks: await feedbackRepository.count(),
            };

            return handlerSuccess(req, res, result);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function dashboard chart study results
     * @author    vudq
     * @date      2022/06/15
     */
    async chartStudyResults(req, res, next) {
        try {
            const currentYear = moment().year();
            const currentMonth = moment().month() + 1;
            const filterYear = +req.query.year || currentYear;
            const findParams = {};

            if (req.query.schools) findParams.schools = req.query.schools;
            if (req.query.faculty) findParams.faculty = req.query.faculty;
            if (req.query.education_id) findParams.education_id = req.query.education_id;
            const result = [];

            if (filterYear === currentYear) {
                const promises = [];
                const users = await userRepository.findAllWithEducation({
                    $and: [findParams, {schools: {$exists: true}, status: USER_STATUS.ACTIVE}],
                });
                const userIds = users.map((user) => user._id);
                for (let i = 1; i < currentMonth; i++) {
                    const newFilter = {...findParams, month: i, year: currentYear};
                    promises.push(getPromiseListHistoryRanking(newFilter));
                }

                if (promises.length > 0) {
                    const list = await Promise.all(promises);
                    for (const [i, v] of list.entries()) {
                        const rank = handleRankMonth(v);
                        result.push({
                            month: i + 1,
                            rank,
                        });
                    }
                }
                const [S, A, B, C, D, G] = await Promise.all([
                    statisticRepository.count({
                        user_id: {$in: userIds},
                        rank: 'S',
                    }),
                    statisticRepository.count({
                        user_id: {$in: userIds},
                        rank: 'A',
                    }),
                    statisticRepository.count({
                        user_id: {$in: userIds},
                        rank: 'B',
                    }),
                    statisticRepository.count({
                        user_id: {$in: userIds},
                        rank: 'C',
                    }),
                    statisticRepository.count({
                        user_id: {$in: userIds},
                        rank: 'D',
                    }),
                    statisticRepository.count({
                        user_id: {$in: userIds},
                        rank: {$exists: false},
                    }),
                ]);
                result.push({
                    month: currentMonth,
                    rank: {
                        S: S,
                        A: A,
                        B: B,
                        C: C,
                        D: D,
                        G: G,
                    },
                });

                if (currentMonth !== 12) {
                    for (let i = currentMonth + 1; i < 13; i++) {
                        const rank = handleRankMonth([]);
                        result.push({
                            month: i,
                            rank,
                        });
                    }
                }
            }

            if (filterYear < currentYear) {
                const promises = [];
                findParams.year = filterYear;
                for (let i = 1; i < 13; i++) {
                    const newFilter = {...findParams, month: i};
                    promises.push(getPromiseListHistoryRanking(newFilter));
                }

                const list = await Promise.all(promises);
                for (const [i, v] of list.entries()) {
                    const rank = handleRankMonth(v);
                    result.push({
                        month: i + 1,
                        rank,
                    });
                }
            }

            return handlerSuccess(req, res, result);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function dashboard time using the app
     * @author    Linhhtm
     * @date      2022/02/22
     */
    async chartTimeUsingTheApp(req, res, next) {
        try {
            const result = [];
            const year = +req.query.year || moment().year();
            const schoolId = req.query.schools;
            const facultyId = req.query.faculty;
            const educationId = req.query.education_id;
            let query = {};

            // Query with year
            if (year) {
                query = {...query, year};
            }
            const statistics = (await statisticUsedTimeRepository.getAll(query)) || [];

            for (let month = 1; month < 13; month++) {
                const element = {month: month};
                const dataInMonth = statistics.filter((item) => item.month === month);

                element.total = dataInMonth.reduce((a, b) => a + b.times, 0);
                if (schoolId) {
                    element.schools = countTimeEducation(dataInMonth, 'school_id', schoolId);
                }
                if (facultyId) {
                    element.faculty = countTimeEducation(dataInMonth, 'faculty_id', facultyId);
                }
                if (educationId) {
                    element.year = countTimeEducation(dataInMonth, 'education_id', educationId);
                }
                result.push(element);
            }
            return handlerSuccess(req, res, result);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },
    /* eslint no-dupe-keys: 0 */
    /**
     * Check user expitation data
     * @author    vudq
     * @date      2022/06/10
     */
    async updateStatusUserExpiration() {
        try {
            const moment = new Date();
            const list = await userRepository.findAllUser({
                status: USER_STATUS.ACTIVE,
                expiration_date: {$exists: true},
                expiration_date: {$lt: moment},
            });

            if (list.length <= 0 || !list) {
                return true;
            }

            const ids = list.map((item) => {
                return item._id;
            });
            await removeUserExpiration(ids);
            return true;
        } catch (error) {
            logger.error(new Error(error));
        }
    },
};

function getPromiseListRankUser(id) {
    return new Promise(function (resolve, reject) {
        statisticRepository
            .findByUserId(id)
            .then((data) => resolve(data))
            .catch((error) => reject(error));
    });
}

function getPromiseListRankUserNew(id) {
    return new Promise(function (resolve, reject) {
        statisticRepository
            .findByUserId(id)
            .then((data) => resolve(data))
            .catch((error) => reject(error));
    });
}

function getPromiseListHistoryRanking(where) {
    return new Promise(function (resolve, reject) {
        historyRankingRepo
            .findAllHist(where)
            .then((data) => resolve(data))
            .catch(() => reject([]));
    });
}

function getPromiseCheckExpirationUser(id) {
    return new Promise(function (resolve, reject) {
        userRepository
            .update(id, {status: 2})
            .then((data) => resolve(data))
            .catch((error) => reject(error));
    });
}

async function removeUserExpiration(ids) {
    const list = [];
    const chunkSize = 10;

    const promiseList = [];
    for (const value of ids) {
        promiseList.push(
            getPromiseCheckExpirationUser(value).catch(() => {
                return null;
            }),
        );
    }

    for (let i = 0; i < promiseList.length; i += chunkSize) {
        const chunk = promiseList.slice(i, i + chunkSize);
        list.push(chunk);
    }

    for (const elements of list) {
        await Promise.all(elements);
    }
}

function getPromiseListNumberTest(id) {
    return new Promise(function (resolve, reject) {
        testRepository
            .count({
                user_id: id,
                score: {$ne: null},
            })
            .then((data) => resolve(data))
            .catch((error) => reject(error));
    });
}

function getPromiseListNumberTestNew(id) {
    return new Promise(function (resolve, reject) {
        testRepository
            .count({
                user_id: id,
                score: {$ne: null},
            })
            .then((data) => resolve(data))
            .catch((error) => reject(error));
    });
}

// function getDate(month, type, year) {
//     const date = !year
//         ? new Date(moment().year() + '-' + month + '-01')
//         : new Date(year + '-' + month + '-01');
//     if (type == 1) {
//         return moment(date).startOf('month');
//     } else {
//         return moment(date).endOf('month');
//     }
// }

// async function sumUsedApp(userIds, start_date, end_date) {
//     const times = await historyUsedTimeRepository.findAll({
//         user_id: {$in: userIds},
//         created_at: {$gte: start_date, $lte: end_date},
//     });
//     return (times || []).reduce((a, b) => a + +b.used_time, 0);
// }

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

function getFindParams(filters) {
    const findByUsedApp = {};
    if (filters.used_app === '0') {
        findByUsedApp.username = null;
        findByUsedApp.usage_time = 0;
    } else if (filters.used_app === '1') {
        findByUsedApp.username = {$ne: null};
        findByUsedApp.usage_time = {$ne: 0};
    }

    const findByStatus = {};
    if (filters.status) {
        findByStatus.status = filters.status;
    } else {
        findByStatus.status = {$in: [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE]};
    }

    const findByCreatedAt = {};
    if (filters.from_date && !filters.to_date) {
        findByCreatedAt.created_at = addMongooseParam(
            findByCreatedAt.from_date,
            '$gte',
            new Date(filters.from_date),
        );
    }

    if (filters.to_date && !filters.from_date) {
        filters.to_date = new Date(filters.to_date);
        findByCreatedAt.created_at = addMongooseParam(
            findByCreatedAt.to_date,
            '$lte',
            new Date(
                filters.to_date.getFullYear(),
                filters.to_date.getMonth(),
                filters.to_date.getDate(),
                23,
                59,
                59,
            ),
        );
    }

    if (filters.from_date && filters.to_date) {
        filters.to_date = new Date(filters.to_date);
        findByCreatedAt.created_at = {
            $gte: new Date(filters.from_date),
            $lte: new Date(
                filters.to_date.getFullYear(),
                filters.to_date.getMonth(),
                filters.to_date.getDate(),
                23,
                59,
                59,
            ),
        };
    }

    const findByHightestScore = {};
    if (filters.hightest_score) findByHightestScore.hightest_score = filters.hightest_score;

    const findByRole = {};
    if (filters.role) {
        findByRole.role = filters.role;
    } else {
        findByRole.role = {$in: [USER_ROLES.USER, USER_ROLES.MENTOR]};
    }

    const findBySchools = {};
    if (filters.schools) findBySchools.schools = filters.schools;

    const findByFaculty = {};
    if (filters.faculty) findByFaculty.faculty = filters.faculty;

    const findByYear = {};
    if (filters.education_id) findByYear.education_id = filters.education_id;

    const findByFullname = {};
    const findByUsername = {};
    const findByPersonalId = {};
    const findByEmail = {};
    if (filters.keyword) {
        findByFullname.full_name = addMongooseParam(
            findByFullname.full_name,
            '$regex',
            new RegExp(filters.keyword, 'i'),
        );

        findByUsername.username = addMongooseParam(
            findByUsername.username,
            '$regex',
            new RegExp(filters.keyword, 'i'),
        );

        findByEmail.email = addMongooseParam(
            findByEmail.email,
            '$regex',
            new RegExp(filters.keyword, 'i'),
        );

        findByPersonalId.personal_id = addMongooseParam(
            findByPersonalId.personal_id,
            '$regex',
            new RegExp(filters.keyword, 'i'),
        );
    }

    const searchKeyword = {$or: [findByFullname, findByEmail, findByUsername, findByPersonalId]};

    const findParams = {
        $and: [
            findByUsedApp,
            findByStatus,
            findByCreatedAt,
            findByHightestScore,
            findByRole,
            searchKeyword,
            findBySchools,
            findByFaculty,
            findByYear,
        ],
    };

    return findParams;
}

function getFilterCsvParams(filters) {
    const finds = {};
    if (filters.schools) finds.schools = filters.schools;

    if (filters.faculty) finds.faculty = filters.faculty;

    if (filters.education_id) finds.education_id = filters.education_id;

    return finds;
}

function getUpdateBodys(updates) {
    const updateBodys = {};
    const errors = [];
    if (updates.email) updateBodys.email = updates.email;

    if (updates.full_name) updateBodys.full_name = updates.full_name;

    if (updates.personal_id) updateBodys.personal_id = updates.personal_id;

    if (updates.status) updateBodys.status = updates.status;

    if (updates.expiration_date) updateBodys.expiration_date = new Date(updates.expiration_date);

    if (updates.schools) updateBodys.schools = updates.schools;

    if (updates.faculty) updateBodys.faculty = updates.faculty;

    if (updates.education_id) updateBodys.education_id = updates.education_id;

    return {updateBodys: updateBodys, errors: errors};
}

async function getCountTest(useId, rootTypeList) {
    const promises = [];

    for (const item of rootTypeList) {
        const where = {
            user_id: useId,
            root_type: item,
            score: {$exists: true},
        };

        promises.push(getPromiseCountTest(where));
    }

    const results = await Promise.all(promises);
    return results;
}

async function getCountTestNew(useId, rootTypeList) {
    const promises = [];

    for (const item of rootTypeList) {
        const where = {
            user_id: useId,
            root_type: item,
            score: {$exists: true},
        };

        promises.push(getPromiseCountTestNew(where));
    }

    const results = await Promise.all(promises);
    return results;
}

function getPromiseCountTest(where) {
    return new Promise(function (resolve, reject) {
        testRepository
            .count(where)
            .then((data) => resolve(data))
            .catch(() => reject(0));
    });
}

function getPromiseCountTestNew(where) {
    return new Promise(function (resolve, reject) {
        testRepository
            .count(where)
            .then((data) => resolve(data))
            .catch(() => reject(0));
    });
}

function sortQuestionType(list) {
    const symbols = ['A', 'B', 'C', 'D', 'E', 'F'];
    const results = [];
    for (const item of symbols) {
        for (const type of list) {
            if (type.symbol === item) {
                results.push(type._id);
            }
        }
    }
    return results;
}

async function getUpdateMentorBodys(updates) {
    const updateBodys = {};
    const errors = [];

    if (updates.email) updateBodys.email = updates.email;

    if (updates.full_name) updateBodys.full_name = updates.full_name;

    return {updateBodys: updateBodys, errors: errors};
}

async function getNumberTestsByUserId(userId) {
    const question_types = await questionTypeRepository.getQuestionTypeAllSortBySymbol({
        parent_id: null,
        status: QUESTION_TYPE_STATUS.ACTIVE,
    });
    const result = [];
    if (question_types) {
        for (let i = 0; i < question_types.length; i++) {
            result.push({
                name: !question_types[i].name ? null : question_types[i].name,
                number_test: await testRepository.count({
                    user_id: userId,
                    root_type: question_types[i]._id,
                    score: {$ne: null},
                }),
            });
        }
    }
    result.push({
        name: '実力診断',
        number_test: await aptitudeTestRepository.count({
            user_id: userId,
            score: {$ne: null},
            spend_times: {$ne: null},
        }),
    });
    return result;
}

async function getNumberTestStatistic(ids) {
    const list = [];
    const chunkSize = 10;
    let listStatistic = [];
    const results = [];

    const promiseList = [];
    for (const value of ids) {
        promiseList.push(
            getPromiseListNumberTest(value).catch(() => {
                return 0;
            }),
        );
    }

    for (let i = 0; i < promiseList.length; i += chunkSize) {
        const chunk = promiseList.slice(i, i + chunkSize);
        list.push(chunk);
    }

    for (const elements of list) {
        const items = await Promise.all(elements);
        listStatistic = [...listStatistic, ...items];
    }

    ids.map((item, index) => {
        const statisticUser = {
            id: item,
            count_test: listStatistic[index],
        };

        results.push(statisticUser);
    });

    return results;
}

async function getNumberTestStatisticNew(ids) {
    // const list = [];
    // const chunkSize = 10;
    // let listStatistic = [];
    // const results = [];
    //
    // const promiseList = [];
    // for (const value of ids) {
    //     promiseList.push(
    //         getPromiseListNumberTestNew(value).catch(() => {
    //             return 0;
    //         }),
    //     );
    // }
    //
    // for (let i = 0; i < promiseList.length; i += chunkSize) {
    //     const chunk = promiseList.slice(i, i + chunkSize);
    //     list.push(chunk);
    // }
    //
    // for (const elements of list) {
    //     const items = await Promise.all(elements);
    //     listStatistic = [...listStatistic, ...items];
    // }
    //
    // ids.map((item, index) => {
    //     const statisticUser = {
    //         id: item,
    //         count_test: listStatistic[index],
    //     };
    //
    //     results.push(statisticUser);
    // });

    // return new Promise(function (resolve, reject) {
    //     testRepository
    //         .count({
    //             user_id: id,
    //             score: {$ne: null},
    //         })
    //         .then((data) => resolve(data))
    //         .catch((error) => reject(error));
    // });



    return await testRepository.countScoreByUserIds(ids);
}

async function getRankUsers(ids, listRootType) {
    const list = [];
    const chunkSize = 10;
    let listStatistic = [];
    const results = [];

    const question_types = await questionTypeRepository.getQuestionTypeAllSortBySymbol({
        parent_id: null,
        status: QUESTION_TYPE_STATUS.ACTIVE,
    });

    const listCountQuestion = await getCountQuestionType(question_types);

    const promiseList = [];
    for (const value of ids) {
        promiseList.push(
            getPromiseListRankUser(value).catch(() => {
                return null;
            }),
        );
    }

    for (let i = 0; i < promiseList.length; i += chunkSize) {
        const chunk = promiseList.slice(i, i + chunkSize);
        list.push(chunk);
    }

    for (const elements of list) {
        const items = await Promise.all(elements);
        listStatistic = [...listStatistic, ...items];
    }

    for (const item of listStatistic) {
        if (!item) {
            const statisticUser = {
                id: null,
                rank: null,
                statistic: ['-', '-', '-', '-', '-', '-'],
            };

            results.push(statisticUser);
        }
        if (item) {
            const rootType = [];
            for (let index = 0; index < listCountQuestion.length; index++) {
                const elm = listCountQuestion[index];
                const correctQuest = item.root_type[elm.symbol];
                let exception = false;
                if (item.user_id == '61b1e4e5a509b3b9ff9fea16') {
                }
                if (correctQuest === 0) {
                    const test = await testRepository.getTest({
                        user_id: item.user_id,
                        root_type: listRootType[index],
                        score: {$exists: true},
                    });

                    if (!test) {
                        exception = true;
                    }
                }

                if (!exception) {
                    const rank = commonFunctions.getRank(correctQuest, elm.count) || '-';
                    rootType.push(rank);
                }
                if (exception) {
                    rootType.push('-');
                }
            }

            const statisticUser = {
                id: item.user_id,
                rank: item.rank || null,
                statistic: rootType,
            };

            results.push(statisticUser);
        }
    }

    return results;
}

async function getRankUsersNew(ids, listRootType) {
    const list = [];
    const chunkSize = 10;
    let listStatistic = [];
    const results = [];

    const question_types = await questionTypeRepository.getQuestionTypeAllSortBySymbol({
        parent_id: null,
        status: QUESTION_TYPE_STATUS.ACTIVE,
    });

    const listCountQuestion = await getCountQuestionType(question_types);

    // const promiseList = [];
    // for (const value of ids) {
    //     promiseList.push(
    //         getPromiseListRankUserNew(value).catch(() => {
    //             return null;
    //         }),
    //     );
    // }
    //
    // // return promiseList;
    //
    // for (let i = 0; i < promiseList.length; i += chunkSize) {
    //     const chunk = promiseList.slice(i, i + chunkSize);
    //     list.push(chunk);
    // }
    //
    // for (const elements of list) {
    //     const items = await Promise.all(elements);
    //     listStatistic = [...listStatistic, ...items];
    // }

    // return listRootType;

    listStatistic = await statisticRepository.findByUserIdsNew(ids);
    const tests = await testRepository.getTestNew({
        user_id: {
            $in: ids
        },
        root_type: {
            $in: listRootType
        },
        score: {$exists: true},
    });

    // return listStatistic;

    for (const id of ids) {
        const item = listStatistic.find(itemStatistic => itemStatistic?.user_id?.toString() === id.toString())

        if (!item) {
            const statisticUser = {
                id: null,
                rank: null,
                statistic: ['-', '-', '-', '-', '-', '-'],
            };

            results.push(statisticUser);
        }
        if (item) {
            const rootType = [];
            for (let index = 0; index < listCountQuestion.length; index++) {
                const elm = listCountQuestion[index];
                const correctQuest = item.root_type[elm.symbol];
                let exception = false;

                if (correctQuest === 0) {
                    // const test = await testRepository.getTest({
                    //     user_id: item.user_id,
                    //     root_type: listRootType[index],
                    //     score: {$exists: true},
                    // });

                    const test = tests.find((itemTest) =>  itemTest._id === item.user_id);

                    if (!test) {
                        exception = true;
                    }
                }

                if (!exception) {
                    const rank = commonFunctions.getRank(correctQuest, elm.count) || '-';
                    rootType.push(rank);
                }
                if (exception) {
                    rootType.push('-');
                }
            }

            const statisticUser = {
                id: item.user_id,
                rank: item.rank || null,
                statistic: rootType,
            };

            results.push(statisticUser);
        }
    }

    return results;
}

async function getCountQuestionType(question_types) {
    const root_type = [];
    for (const item of question_types) {
        const itemValue = item._id;
        const count = await questionRepository.count({
            root_type: itemValue,
            status: QUESTION_STATUS.ACTIVE,
        });
        const statistic = {
            count,
            name: item.name,
            symbol: `root_type_${item.symbol}`,
        };
        root_type.push(statistic);
    }

    return root_type;
}

function getCountTestWithUserId(id, list) {
    let count = 0;
    list.map((item) => {
        if (item.id?.toString() === id?.toString()) {
            count = item.count_test;
        }
    });
    return count;
}

function handleRankMonth(input) {
    const rank = {
        S: 0,
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        G: 0,
    };
    if (input.length === 0) {
        return rank;
    }

    if (input.length > 0) {
        return {
            S: input.reduce((a, b) => a + b.count[0].count, 0),
            A: input.reduce((a, b) => a + b.count[1].count, 0),
            B: input.reduce((a, b) => a + b.count[2].count, 0),
            C: input.reduce((a, b) => a + b.count[3].count, 0),
            D: input.reduce((a, b) => a + b.count[4].count, 0),
            G: input.reduce((a, b) => a + b.count[5].count, 0),
        };
    }
}

function countTimeEducation(data = [], key, keyValue) {
    return data
        .filter((item) => item[key].toHexString() === keyValue)
        .reduce((a, b) => a + b.times, 0);
}

function findNumberTestBySymbolQuestion(countTestDetailByUser, symbolQuestion) {
    return countTestDetailByUser.find(item => item.symbolQuestionType === symbolQuestion)?.count || 0;
}
