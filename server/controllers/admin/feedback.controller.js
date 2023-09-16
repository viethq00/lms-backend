const feedbackRepository = require('../../repositories/feedback.repository');
const {getHeaders, checkExistedFeedback} = require('../../utils/helper');
const {
    handlerSuccess,
    handlerNotFoundError,
    handlerBadRequestError,
} = require('../../utils/handler.response');
const logger = require('../../utils/logger');
const ErrorMessage = require('../../utils/errorMessage').ErrorMessage;
const nodeMailer = require('nodemailer');
const {EMAIL} = require('../../utils/consts');
const ObjectID = require('mongodb').ObjectID;

module.exports = {
    classname: 'AdminFeedbackController',

    /**
     * Function list feedback
     * @author    Linhhtm
     * @date      2021/11/13
     */
    async indexFeedbacks(req, res, next) {
        try {
            const param = {};
            if (req.query.sort_user) {
                param.user_id = req.query.sort_user;
            } else if (req.query.sort_answer) {
                param.answer = req.query.sort_answer;
            } else {
                param.created_at = -1;
            }

            const page = +req.query.page || 1;
            const perPage = +req.query.limit || 20;

            const count = await feedbackRepository.count();
            const responseHeaders = getHeaders(count, page, perPage);

            const feedbacks = await feedbackRepository.findAll(param, {
                page,
                perPage,
            });

            return handlerSuccess(req, res, {
                items: feedbacks,
                headers: responseHeaders,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function detail feedback
     * @author    Linhhtm
     * @date      2021/11/14
     */
    async getDetailFeedback(req, res, next) {
        try {
            const feedback = await feedbackRepository.findById(req.params.id);
            if (!feedback) {
                return handlerNotFoundError(req, res, ErrorMessage.FEEDBACK_IS_NOT_FOUND);
            }
            return handlerSuccess(req, res, feedback);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function send feedback
     * @author    Linhhtm
     * @date      2021/11/14
     */
    async sendFeedback(req, res, next) {
        try {
            const feedback = await feedbackRepository.findById(req.params.id);
            if (!feedback) {
                return handlerNotFoundError(req, res, ErrorMessage.FEEDBACK_IS_NOT_FOUND);
            }

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
                to: feedback.user_id.email,
                subject: 'お問い合わせについて　ポケ模型運営事務局',
                html:
                    'ポケ模型へのお問い合わせありがとうございました。' +
                    '<br>' +
                    'お問い合わせに関し以下の通り回答します。' +
                    '<br>' +
                    'ご確認お願いいたします。' +
                    '<br>' +
                    '－－－' +
                    '<br>' +
                    feedback.user_id.full_name +
                    '様 <br>' +
                    '質問：' +
                    feedback.question +
                    '<br>' +
                    '回答：' +
                    req.body.answer +
                    '<br>' +
                    '－－－' +
                    '<br>' +
                    'ポケ模型運営事務局' +
                    '<br>' +
                    'TECH Planning合同会社　pokemoke@techplan.net',
            };
            transporter.sendMail(options);

            // update feedback
            const feedbackUpdate = await feedbackRepository.update(feedback._id, {
                updated_at: new Date(),
                answer: req.body.answer,
            });
            return handlerSuccess(req, res, feedbackUpdate);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function delete feedbacks
     * @author    Linhhtm
     * @date      2021/11/14
     */
    async deleteFeedbacks(req, res, next) {
        try {
            const feedback_ids = req.body;

            feedback_ids.forEach((item) => {
                if (ObjectID.isValid(item) === false) {
                    return handlerBadRequestError(req, res, `Id '${item}' is not ObjectId`);
                }
            });

            const errorIds = await checkExistedFeedback(feedbackRepository, feedback_ids);
            if (errorIds.length > 0) {
                return handlerBadRequestError(
                    req,
                    res,
                    `Ids '${errorIds.join(', ')}' is not found!`,
                );
            }
            await feedbackRepository.deleteMany(feedback_ids);
            return handlerSuccess(req, res, ErrorMessage.DELETE_FEEDBACK_IS_SUCCESS);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },
};
