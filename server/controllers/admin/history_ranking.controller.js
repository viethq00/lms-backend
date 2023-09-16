const logger = require('../../utils/logger');
const userRepository = require('../../repositories/user.repository');
const {handlerSuccess} = require('../../utils/handler.response');
const {RANK} = require('../../utils/consts');
const {getHeaders, getValueInEnum} = require('../../utils/helper');
const historyRankingRepo = require('../../repositories/history_ranking.repository');
const eduRepo = require('../../repositories/education.repository');
const statisticRepository = require('../../repositories/statistic.repository');
const moment = require('moment');
const {handlerNotFoundError} = require('../../utils/handler.response');
const {getAllEducation} = require('../../repositories/education.repository');

const ObjectID = require('mongodb').ObjectID;

module.exports = {
    classname: 'HistoryRankingController',

    /**
     * Function list all history ranking
     * @author    vudq
     * @date      2022/06/13
     */
    async indexs(req, res, next) {
        try {
            const findParams = getFilterParams(req.query);
            const page = +req.query.page || 1;
            const perPage = +req.query.limit || 20;

            const count = await historyRankingRepo.count(findParams);
            const responseHeaders = getHeaders(count, page, perPage);

            const hist = await historyRankingRepo.findAll(findParams, {
                page,
                perPage,
            });
            return handlerSuccess(req, res, {
                items: hist,
                headers: responseHeaders,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function get detail history ranking
     * @author    vudq
     * @date      2022/06/13
     */
    async detail(req, res, next) {
        try {
            const hist = await userRepository.findById(req.params.id);
            if (!hist) {
                return handlerNotFoundError(req, res, 'Not found!');
            }

            return handlerSuccess(req, res, hist);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },
    /**
     * Function create history ranking
     * @author    vudq
     * @date      2022/06/13
     */
    async create(req, res, next) {
        try {
            const listEducation = await getAllEducation();
            const eduIds = listEducation.map((item) => item._id);

            for (const item of eduIds) {
                await module.exports.createHistoryRanking(item);
            }

            return handlerSuccess(req, res, true);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function create history ranking with cron job
     * @author    vudq
     * @date      2022/06/13
     */
    async createHistoryRanking(educationId) {
        try {
            if (!educationId || !ObjectID.isValid(educationId)) {
                return false;
            }
            const timestamp = handleCurrentYear();

            const isExisted = await historyRankingRepo.findOne({
                month: timestamp.month,
                year: timestamp.year,
                education_id: educationId,
            });

            if (isExisted) {
                return false;
            }
            const promiseList = [];
            const listRank = getValueInEnum(RANK);
            const filters = {
                education_id: educationId,
                status: 1, // active
            };

            const edu = await eduRepo.findById(educationId);
            const users = await userRepository.findAllWithEducation(filters);
            const userIds = users.map((user) => user._id);

            for (const item of listRank) {
                promiseList.push(
                    getPromiseListCountRank(item, userIds).catch(() => {
                        return 0;
                    }),
                );
            }

            const items = await Promise.all(promiseList);
            const facultyId = edu.parent_id.id;
            const schoolId = edu.parent_id.parent_id.id;

            const countRank = [
                {
                    rank: RANK.S,
                    count: items[0],
                },
                {
                    rank: RANK.A,
                    count: items[1],
                },
                {
                    rank: RANK.B,
                    count: items[2],
                },
                {
                    rank: RANK.C,
                    count: items[3],
                },
                {
                    rank: RANK.D,
                    count: items[4],
                },
                {
                    rank: RANK.G,
                    count: items[5],
                },
            ];

            const newHist = {
                count: countRank,
                schools: schoolId,
                faculty: facultyId,
                education_id: educationId,
                month: timestamp.month,
                year: timestamp.year,
            };

            await historyRankingRepo.create(newHist);
            return true;
        } catch (error) {
            logger.error(new Error(error));
        }
    },
};

function getFilterParams(filters) {
    const finds = {};
    if (filters.schools) finds.schools = filters.schools;

    if (filters.faculty) finds.faculty = filters.faculty;

    if (filters.education_id) finds.education_id = filters.education_id;

    return finds;
}

function getPromiseListCountRank(rank, userIds) {
    return new Promise(function (resolve, reject) {
        if (rank === 'G') {
            statisticRepository
                .count({
                    user_id: {$in: userIds},
                    rank: {$exists: false},
                })
                .then((data) => resolve(data))
                .catch((error) => reject(error));
        }
        if (rank !== 'G') {
            statisticRepository
                .count({
                    user_id: {$in: userIds},
                    rank,
                })
                .then((data) => resolve(data))
                .catch((error) => reject(error));
        }
    });
}

function handleCurrentYear() {
    let year = moment().year();
    let month = moment().month() + 1;

    if (month === 1) {
        month = 12;
        year = year - 1;

        return {
            month,
            year,
        };
    }

    month = month - 1;

    return {
        month,
        year,
    };
}
