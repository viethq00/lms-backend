const {body, param} = require('express-validator');
const userRepository = require('../repositories/user.repository');
const ErrorMessage = require('../utils/errorMessage').ErrorMessage;
const {USER_ROLES} = require('../utils/consts');
const {handlerPermissionDeniedError, handlerNotFoundError} = require('../utils/handler.response');

module.exports = {
    classname: 'ValidateAdmin',

    register: () => {
        return [
            body('full_name').not().isEmpty().withMessage('フルネームパラメータがありません'),
            body('email').not().isEmpty().withMessage('メールアドレスパラメータがありません'),
            body('expiration_date').not().isEmpty().withMessage('有効期限のパラメータがありません'),
            body('email').isEmail().withMessage('メールアドレスのフォーマットが正しくない'),
            // body('personal_id')
            //     .custom((value) => {
            //         if (!value) {
            //             return false;
            //         }

            //         const regex = /^(?=.*[a-z])(?=.*\d)[A-Za-z0-9\d-]{6,14}$/;
            //         const isCorrect = regex.test(value);

            //         if (!isCorrect) {
            //             return false;
            //         }

            //         return true;
            //     })
            //     .withMessage('Must have least 1 letter, 1 number'),
            // body('personal_id')
            //     .custom((value) => {
            //         if (value.length < 6 || value.length > 14) {
            //             return false;
            //         }
            //         return true;
            //     })
            //     .withMessage('Personal id length 6~14 characters'),
        ];
    },

    createdMentor: () => {
        return [
            body('full_name').not().isEmpty().withMessage('フルネームパラメータがありません'),
            body('email').not().isEmpty().withMessage('メールアドレスパラメータがありません'),
            body('email').isEmail().withMessage('メールアドレスのフォーマットが正しくない'),
            body('username').not().isEmpty().withMessage('ユーザー名パラメータがありません'),
            body('username')
                .custom((value) => {
                    if (value.length < 4 || value.length > 12) {
                        return false;
                    }
                    return true;
                })
                .withMessage('ユーザー名は4~12桁で入力してください'),
            body('password')
                .custom((value) => {
                    if (value.length < 6 || value.length > 14) {
                        return false;
                    }
                    return true;
                })
                .withMessage('個人IDは6~14桁で入力してください'),
        ];
    },

    createdTeacher: () => {
        return [
            body('full_name').not().isEmpty().withMessage('フルネームパラメータがありません'),
            body('email').not().isEmpty().withMessage('メールアドレスパラメータがありません'),
            body('email').isEmail().withMessage('メールアドレスのフォーマットが正しくない'),
            body('username').not().isEmpty().withMessage('ユーザー名パラメータがありません'),
            body('username')
                .custom((value) => {
                    if (value.length < 4 || value.length > 12) {
                        return false;
                    }
                    return true;
                })
                .withMessage('ユーザー名は4~12桁で入力してください'),
            body('password')
                .custom((value) => {
                    if (value.length < 6 || value.length > 14) {
                        return false;
                    }
                    return true;
                })
                .withMessage('個人IDは6~14桁で入力してください'),
        ];
    },

    login: () => {
        return [
            body('email').not().isEmpty().withMessage('メールアドレスパラメータがありません'),
            body('email').isEmail().withMessage('メールアドレスのフォーマットが正しくない'),
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

    update: () => {
        return [
            param('id').not().isEmpty().withMessage('Missing id parameter'),
            body('full_name').not().isEmpty().withMessage('フルネームパラメータがありません'),
            body('email').not().isEmpty().withMessage('メールアドレスパラメータがありません'),
            body('email').isEmail().withMessage('メールアドレスのフォーマットが正しくない'),
            body('expiration_date').not().isEmpty().withMessage('有効期限のパラメータがありません'),
            // body('personal_id')
            //     .custom((value) => {
            //         if (!value) {
            //             return false;
            //         }

            //         const regex = /^(?=.*[a-z])(?=.*\d)[A-Za-z0-9\d-]{6,14}$/;
            //         const isCorrect = regex.test(value);

            //         if (!isCorrect) {
            //             return false;
            //         }

            //         return true;
            //     })
            //     .withMessage('個人IDは少なくとも1つの小文字と1つの数字を含む必要があります。'),
            // body('personal_id')
            //     .custom((value) => {
            //         if (value.length < 6 || value.length > 14) {
            //             return false;
            //         }
            //         return true;
            //     })
            //     .withMessage('個人IDは6~14桁で入力してください'),
        ];
    },

    checkRole: async (req, res, next) => {
        const user = await userRepository.findById(req.decoded.id);
        if (!user) return handlerNotFoundError(req, res, ErrorMessage.ACCOUNT_IS_NOT_FOUND);

        if (user.role === USER_ROLES.USER) {
            return handlerPermissionDeniedError(req, res, ErrorMessage.PERMISSION_DENIED);
        }
        next();
    },
    updateMentor: () => {
        return [
            param('id').not().isEmpty().withMessage('Missing id parameter'),
            body('full_name').not().isEmpty().withMessage('フルネームパラメータがありません'),
            body('email').not().isEmpty().withMessage('メールアドレスパラメータがありません'),
            body('email').isEmail().withMessage('メールアドレスのフォーマットが正しくない'),
        ];
    },
    downloadCsv: () => {
        return [
            param('schools').not().isEmpty().withMessage('Missing schools parameter'),
            param('faculty').not().isEmpty().withMessage('Missing faculty parameter'),
        ];
    },
};
