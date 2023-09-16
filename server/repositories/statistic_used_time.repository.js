const moment = require('moment');
const {StatisticUsedTimeModel, HistoryUsedTime} = require('../models');
const userRepository = require('./user.repository');
const {groupBy} = require('lodash');
const logger = require('../utils/logger');

async function checkAndCreateInMonth(school_id, faculty_id, education_id) {
    try {
        const year = moment().year();
        const month = moment().month() + 1;
        let doc = await StatisticUsedTimeModel.findOne({education_id, month, year});
        if (!doc) {
            doc = await StatisticUsedTimeModel.create({
                year,
                month,
                school_id,
                faculty_id,
                education_id,
            });
        }
        return doc;
    } catch (e) {
        logger.error(e);
        return null;
    }
}

async function logUsedTime(req) {
    try {
        const account = await userRepository.findById(req.decoded.id);
        if (account && account.schools && account.education_id) {
            const doc = await checkAndCreateInMonth(
                account.schools,
                account.faculty,
                account.education_id,
            );
            const time = +req.query.usage_time || 0;
            if (doc && time) {
                await StatisticUsedTimeModel.updateOne({_id: doc._id}, {$inc: {times: time}});
            }
        }
    } catch (e) {
        logger.error(e);
    }
}

async function getAll(query = {}) {
    try {
        return StatisticUsedTimeModel.find(query);
    } catch (e) {
        logger.error(e);
        return [];
    }
}

async function crowData() {
    try {
        const checkStatisticExisted = await StatisticUsedTimeModel.countDocuments();
        if (checkStatisticExisted > 0) {
            return logger.info('Data had crown');
        }
        const allUsedTimeData = await HistoryUsedTime.find({used_time: {$ne: '0'}}).populate(
            'user_id',
        );
        const allUsedTimeDataFormatter = allUsedTimeData
            .filter(
                (item) =>
                    item.user_id &&
                    item.user_id.schools &&
                    item.user_id.faculty &&
                    item.user_id.education_id,
            )
            .map((item) => ({
                time: +item.used_time,
                school_id: item.user_id.schools,
                faculty_id: item.user_id.faculty,
                education_id: item.user_id.education_id,
                created_at: moment(item.created_at).format('YYYY-MM'),
            }));
        const dataGroupByEducation = groupBy(allUsedTimeDataFormatter, 'education_id');
        const dataStatistic = Object.keys(dataGroupByEducation).map((education_id) => {
            const educationData = dataGroupByEducation[education_id];
            const groupByMonth = groupBy(educationData, 'created_at');
            const data = Object.keys(groupByMonth).map((created_at) => {
                const item = groupByMonth[created_at][0];
                return {
                    year: +created_at.split('-')[0],
                    month: +created_at.split('-')[1],
                    school_id: item.school_id,
                    faculty_id: item.faculty_id,
                    education_id: item.education_id,
                    times: groupByMonth[created_at].reduce((a, b) => a + b.time, 0),
                };
            });
            return {education: education_id, data: data};
        });

        const saved = await Promise.all(
            dataStatistic.map((item) => StatisticUsedTimeModel.insertMany(item.data)),
        );
        logger.info('Data crowned', saved);
    } catch (e) {
        logger.info(e);
    }
}

module.exports = {
    logUsedTime,
    getAll,
    crowData,
};
