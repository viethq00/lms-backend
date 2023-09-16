const {validationResult} = require('express-validator');
const {_errorFormatter} = require('../../utils/helper');
const feedbackRepository = require('../../repositories/feedback.repository');
const userRepository = require('../../repositories/user.repository');
const {handlerSuccess, handlerBadRequestError} = require('../../utils/handler.response');
const logger = require('../../utils/logger');
const nodeMailer = require('nodemailer');
const {EMAIL} = require('../../utils/consts');
const receiverFeedbackRepo = require('../../repositories/receiver_feedback.repo');
const {logUsedTime} = require('../../repositories/statistic_used_time.repository');

module.exports = {
    classname: 'UserFeedbackController',

    created: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            const newFeedback = {
                user_id: req.decoded.id,
                question: req.body.question,
                answer: null,
            };
            const createFeedback = await feedbackRepository.create(newFeedback);

            // time using the app
            const user = await userRepository.findById(req.decoded.id);
            if (req.query.usage_time && user) {
                const time = +user.usage_time + +req.query.usage_time;
                await userRepository.update(req.decoded.id, {usage_time: time});
                // await historyUsedTimeRepository.create({
                //     used_time: req.query.usage_time,
                //     user_id: req.decoded.id,
                // });
                await logUsedTime(req);
            }

            const listReceiver = await receiverFeedbackRepo.findAllUser({});
            if (!listReceiver || listReceiver.length <= 0) {
                return handlerSuccess(req, res, createFeedback);
            }

            const listEmail = [];
            listReceiver.map((item) => {
                if (item.email) {
                    listEmail.push(item.email);
                }
            });

            // send email
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
                to: listEmail,
                subject: '【ポケ模型】フィードバック受信通知',
                html:
                    'ポケ模型にユーザーからフィードバックを受信しました' +
                    '<br>' +
                    '管理画面で内容を確認してください。' +
                    '<br>' +
                    '----------------------------' +
                    '<br>' +
                    newFeedback.question +
                    '<br>' +
                    '----------------------------' +
                    '<br>' +
                    'ポケ模型運営事務局' +
                    '<br>' +
                    'TECH Planning合同会社　pokemoke@techplan.net',
            };

            transporter.sendMail(options);

            return handlerSuccess(req, res, createFeedback);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },
};
