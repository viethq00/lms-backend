const {body} = require('express-validator');
const userRepository = require('../repositories/user.repository');
const ErrorMessage = require('../utils/errorMessage').ErrorMessage;
const {USER_ROLES} = require('../utils/consts');
const {
    handlerPermissionDeniedError,
    handlerNotFoundError,
    handlerBadRequestError,
} = require('../utils/handler.response');

module.exports = {
    classname: 'ValidateUser',

    register: () => {
        return [
            body('full_name').not().isEmpty().withMessage('フルネームパラメータがありません'),
            body('email').not().isEmpty().withMessage('メールアドレスパラメータがありません'),
            body('email').isEmail().withMessage('メールアドレスのフォーマットが正しくない'),
            body('username').not().isEmpty().withMessage('メールアドレスパラメータがありません'),
            body('password').not().isEmpty().withMessage('パスワードパラメータがありません'),
            body('password')
                .custom((value) => {
                    if (!value) {
                        return false;
                    }
                    const regex = /^(?=.*[a-z])(?=.*\d)[A-Za-z0-9\d-]{6,14}$/;
                    const isCorrect = regex.test(value);
                    if (!isCorrect) {
                        return false;
                    }
                    return true;
                })
                .withMessage('パスワードは少なくとも1つの小文字と1つの数字を含む必要があります。'),
            body('password')
                .custom((value) => {
                    if (value.length < 6 || value.length > 14) {
                        return false;
                    }
                    return true;
                })
                .withMessage('パスワードは6~14桁で入力してください'),
        ];
    },

    login: () => {
        return [
            body('username').not().isEmpty().withMessage('ユーザー名パラメータがありません'),
            body('password')
                .custom((value) => {
                    if (!value) {
                        return false;
                    }
                    const regex = /^(?=.*[a-z])(?=.*\d)[A-Za-z0-9\d-]{6,14}$/;
                    const isCorrect = regex.test(value);
                    if (!isCorrect) {
                        return false;
                    }
                    return true;
                })
                .withMessage('パスワードは少なくとも1つの小文字と1つの数字を含む必要があります。'),
            body('password')
                .custom((value) => {
                    if (value.length < 6 || value.length > 14) {
                        return false;
                    }
                    return true;
                })
                .withMessage('パスワードは6~14桁で入力してください'),
        ];
    },

    refreshToken: () => {
        return [
            body('refreshToken')
                .not()
                .isEmpty()
                .withMessage('新しいトークンのパラメータがありません'),
        ];
    },

    updateUser: () => {
        return [
            body('username').not().isEmpty().withMessage('ユーザー名パラメータがありません'),
            body('password').not().isEmpty().withMessage('パスワードパラメータがありません'),
            body('password')
                .custom((value) => {
                    if (value.length < 6 || value.length > 14) {
                        return false;
                    }
                    return true;
                })
                .withMessage('パスワードは6~14桁で入力してください'),
        ];
    },

    updateUsername: () => {
        return [body('username').not().isEmpty().withMessage('ユーザー名パラメータがありません')];
    },

    changePassword: () => {
        return [
            body('old_password')
                .not()
                .isEmpty()
                .withMessage('古いパスワードのパラメータがありません'),
            body('old_password')
                .custom((value) => {
                    if (value.length < 6 || value.length > 14) {
                        return false;
                    }
                    return true;
                })
                .withMessage('古いパスワードは6~14桁で入力してください'),
            body('password').not().isEmpty().withMessage('パスワードパラメータがありません'),
            body('password')
                .custom((value) => {
                    if (value.length < 6 || value.length > 14) {
                        return false;
                    }
                    return true;
                })
                .withMessage('パスワードは6~14桁で入力してください'),
        ];
    },

    checkRole: async (req, res, next) => {
        const user = await userRepository.findById(req.decoded.id);
        if (!user) {
            return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
        }

        if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.MENTOR) {
            return handlerPermissionDeniedError(req, res, ErrorMessage.PERMISSION_DENIED);
        }
        next();
    },

    checkAccessToken: async (req, res, next) => {
        const user = await userRepository.findByEmail(req.decoded.email);
        if (!user) {
            return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);
        }

        if (user.access_token !== req.headers.authorization) {
            return handlerBadRequestError(req, res, ErrorMessage.SIGNED_IN_ON_ANOTHER_DEVICE);
        }
        next();
    },

    forgotPassword: () => {
        return [
            body('email').not().isEmpty().withMessage('メールアドレスパラメータがありません'),
            body('email').isEmail().withMessage('メールアドレスのフォーマットが正しくない'),
        ];
    },

    resetPassword: () => {
        return [
            body('email').not().isEmpty().withMessage('メールアドレスパラメータがありません'),
            body('email').isEmail().withMessage('メールアドレスのフォーマットが正しくない'),
            body('password').not().isEmpty().withMessage('パスワードパラメータがありません'),
            body('password')
                .custom((value) => {
                    if (value.length < 6 || value.length > 14) {
                        return false;
                    }
                    return true;
                })
                .withMessage('パスワードは6~14桁で入力してください'),
        ];
    },

    verifyCode: () => {
        return [body('code').not().isEmpty().withMessage('コードパラメータがありません')];
    },
};
