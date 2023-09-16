const {validationResult} = require('express-validator');
const ErrorMessage = require('../../utils/errorMessage').ErrorMessage;
const {_errorFormatter, addMongooseParam, getHeaders} = require('../../utils/helper');
const logger = require('../../utils/logger');
// const feedbackRepository = require('../../repositories/feedback.repository');
const receiverFeedbackRepo = require('../../repositories/receiver_feedback.repo');
const ObjectID = require('mongodb').ObjectID;
const {
    handlerSuccess,
    handlerBadRequestError,
    handlerNotFoundError,
} = require('../../utils/handler.response');

module.exports = {
    classname: 'ReceiverFeedbackController',

    /**
     * Function add email to receive feedback
     * @author    vudq
     * @date      2021/08/07
     */
    add: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            // const newEmail = {
            //     email: req.body.emails,
            //     // schools: req.body.schools,
            //     // faculty: req.body.faculty,
            //     // education_id: req.body.education_id,
            // };

            const listEmails = req.body.emails;

            if (!listEmails || listEmails.length <= 0) {
                return handlerBadRequestError(req, res, ErrorMessage.EMAILS_IS_NOT_MATCH);
            }

            const list = await listPromise(listEmails);

            if (list.length == 0) {
                return handlerSuccess(req, res, 'No item to add list');
            }

            const created = await Promise.all(list);
            // const user = await receiverFeedbackRepo.findByEmail(req.body.email);
            // if (user) {
            //     return handlerBadRequestError(req, res, ErrorMessage.EMAIL_IS_ALREADY_EXISTED);
            // }

            // const created = await receiverFeedbackRepo.create(newEmail);

            // if (!created) {
            //     return handlerInternalServerError(req, res, ErrorMessage.Internal_Server_Error);
            // }
            return handlerSuccess(req, res, created);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function get list receiver
     * @author    Linhhtm
     * @date      2021/11/09
     */
    async indexs(req, res, next) {
        try {
            const findParams = getFindParams(req.query);
            const page = +req.query.page || 1;
            const perPage = +req.query.limit || 20;

            const count = await receiverFeedbackRepo.count(findParams);
            const responseHeaders = getHeaders(count, page, perPage);

            const accounts = await receiverFeedbackRepo.findAll(findParams, {
                page,
                perPage,
            });

            return handlerSuccess(req, res, {
                items: accounts,
                headers: responseHeaders,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function get detail receiver
     * @author    vudq
     * @date      2021/08/07
     */
    async getDetailUser(req, res, next) {
        try {
            if (!ObjectID.isValid(req.params.id)) {
                return handlerBadRequestError(req, res, 'Id is not match ObjectId');
            }
            const account = await receiverFeedbackRepo.findById(req.params.id);
            if (!account) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            return handlerSuccess(req, res, account);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function update receiver
     * @author    vudq
     * @date      2021/08/07
     */
    async updateReceiver(req, res, next) {
        try {
            if (!ObjectID.isValid(req.params.id)) {
                return handlerBadRequestError(req, res, 'Id is not match ObjectId');
            }
            const account = await receiverFeedbackRepo.findById(req.params.id);
            if (!account) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }

            const updateParams = {};

            if (req.body.email) {
                updateParams.email = req.body.email;
            }

            return handlerSuccess(req, res, account);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function remove receiver
     * @author    vudq
     * @date      2021/08/07
     */
    async removeReceiver(req, res, next) {
        try {
            if (!ObjectID.isValid(req.params.id)) {
                return handlerBadRequestError(req, res, 'Id is not match ObjectId');
            }
            const account = await receiverFeedbackRepo.findById(req.params.id);
            if (!account) {
                return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
            }
            const remove = await receiverFeedbackRepo.delete(req.params.id);

            return handlerSuccess(req, res, remove);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },
};

function getFindParams(filters) {
    const finds = {};
    finds.email = addMongooseParam(finds.email, '$regex', new RegExp(filters.email, 'i'));

    return finds;
}

async function listPromise(emails) {
    const lists = [];

    for (const item of emails) {
        try {
            const findOne = await receiverFeedbackRepo.findByEmail(item);
            if (!findOne) {
                const data = {
                    email: item,
                };

                lists.push(receiverFeedbackRepo.create(data));
            }
        } catch (error) {
            logger.error(new Error(error));
        }
    }

    return lists;
}
