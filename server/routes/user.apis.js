const express = require('express');
const router = express.Router();

const userAccountController = require('../controllers/user/account.controller');
const testController = require('../controllers/user/test.controller');
const feedbackController = require('../controllers/user/feedback.controller');
const validateUser = require('../requests/validate.user');
const validateFeedback = require('../requests/validate.feedback');
// Require utils
const isAuth = require('../utils/validate.token');

// Account apis

router.put('/forgot-password', validateUser.forgotPassword(), userAccountController.forgotPassword);

router.get('/verify-code', validateUser.verifyCode(), userAccountController.verifyCode);

router.put('/reset-password', validateUser.resetPassword(), userAccountController.resetPassword);

router.post('/refresh-token', validateUser.refreshToken(), userAccountController.refreshToken);

router.post('/login', validateUser.login(), userAccountController.login);

router.post('/register', validateUser.register(), userAccountController.register);

router.get(
    '/detail',
    isAuth.validateToken,
    validateUser.checkRole,
    validateUser.checkAccessToken,
    userAccountController.getDetailUser,
);

router.put(
    '/update',
    validateUser.updateUser(),
    isAuth.validateToken,
    validateUser.checkRole,
    validateUser.checkAccessToken,
    userAccountController.updateUser,
);

router.put(
    '/change-password',
    validateUser.changePassword(),
    isAuth.validateToken,
    validateUser.checkRole,
    validateUser.checkAccessToken,
    userAccountController.changePassword,
);

router.patch(
    '/update-username',
    validateUser.updateUsername(),
    isAuth.validateToken,
    validateUser.checkRole,
    validateUser.checkAccessToken,
    userAccountController.updateUsername,
);

// Test apis
router.post(
    '/test',
    isAuth.validateToken,
    validateUser.checkRole,
    validateUser.checkAccessToken,
    testController.createTest,
);

router.post(
    '/test-result',
    isAuth.validateToken,
    validateUser.checkRole,
    validateUser.checkAccessToken,
    testController.testResult,
);

router.post(
    '/my-page',
    isAuth.validateToken,
    validateUser.checkRole,
    validateUser.checkAccessToken,
    userAccountController.getExamResult,
);

// Feedback apis
router.post(
    '/feedback',
    validateFeedback.create(),
    isAuth.validateToken,
    validateUser.checkRole,
    validateUser.checkAccessToken,
    feedbackController.created,
);

module.exports = router;
