const express = require('express');
const router = express.Router();

// Require controller modules.
const adminAccountController = require('../controllers/admin/account.controller');
const questionTypeController = require('../controllers/admin/question_type.controller');
const questionController = require('../controllers/admin/question.controller');
const imagesUploadController = require('../controllers/admin/images_upload.controller');
const feedbackController = require('../controllers/admin/feedback.controller');
const receiverFeedbackController = require('../controllers/admin/receiver_feedback.controller');
const fileController = require('../controllers/admin/media.controller');
const educationController = require('../controllers/admin/education.controller');
const histRankingController = require('../controllers/admin/history_ranking.controller');

// Require request validators
const validateAdmin = require('../requests/validate.admin');
const validateQuestion = require('../requests/validate.question');
const validateQuestionType = require('../requests/validate.question_type');
const validateFeedback = require('../requests/validate.feedback');

// Require utils
const isAuth = require('../utils/validate.token');
const accountController = require('../controllers/admin/account.controller');
const authorize = require('../requests/author');
const {USER_ROLES} = require('../utils/consts');
// Account apis
//validateAdmin.login()

const AdminRole = [USER_ROLES.ADMIN];
// const AdminTeacherRole = [USER_ROLES.ADMIN, USER_ROLES.TEACHER];
// const AdminTeacherMentorRole = [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.MENTOR];

router.post('/login', validateAdmin.login(), adminAccountController.login);

router.post('/refresh-token', validateAdmin.refreshToken(), adminAccountController.refreshToken);

router.get(
    '/users',
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.indexAccounts,
);

router.post(
    '/users',
    validateAdmin.register(),
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.createdUser,
);

router.post(
    '/users/create-mentor',
    validateAdmin.createdMentor(),
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.createdMentor,
);

router.post(
    '/users/create-teacher',
    validateAdmin.createdTeacher(),
    isAuth.validateToken,
    authorize(AdminRole),
    adminAccountController.createdTeacher,
);

router.get(
    '/users/:id',
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.getDetailUser,
);

router.put(
    '/users/:id',
    validateAdmin.update(),
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.updateUser,
);

router.put(
    '/users/update-mentor/:id',
    validateAdmin.updateMentor(),
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.updateMentor,
);

router.delete(
    '/users',
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.deleteUsers,
);

router.put(
    '/user/update-status',
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.updateStatus,
);

router.post(
    '/users/import-users',
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.importUserFromExcel,
);

router.get(
    '/user/user-form',
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.download,
);

router.get(
    '/user/download-csv',
    // validateAdmin.downloadCsv(),
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.downloadCsvAccounts,
);

router.get(
    '/user/download-csv-old',
    // validateAdmin.downloadCsv(),
    isAuth.validateToken,
    validateAdmin.checkRole,
    adminAccountController.downloadCsvAccountsOld,
);

// Question type apis
router.post(
    '/question-type/import-question-type',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionTypeController.importQuestionTypeFromExcel,
);

router.get(
    '/question-type',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionTypeController.indexQuestionTypes,
);

router.post(
    '/question-type',
    validateQuestionType.create(),
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionTypeController.created,
);

router.delete(
    '/question-type',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionTypeController.deletedMany,
);

router.get(
    '/question-type/:id',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionTypeController.getDetailQuestionType,
);

router.put(
    '/question-type/:id',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionTypeController.updated,
);

router.delete(
    '/question-type/:id',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionTypeController.deleted,
);

router.get(
    '/question-type-all',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionTypeController.getQuestionTypeAll,
);

// Question apis
router.post(
    '/import-questions',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionController.importQuestionFromExcel,
);

router.post(
    '/questions',
    validateQuestion.createQuestion(),
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionController.createQuestion,
);

router.get(
    '/questions',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionController.indexQuestions,
);

router.get(
    '/questions/:id',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionController.getDetailQuestion,
);

router.put(
    '/questions/:id',
    isAuth.validateToken,
    validateAdmin.checkRole,
    validateQuestion.updateQuestion(),
    questionController.updateQuestion,
);

router.put(
    '/question/update-status',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionController.updateStatus,
);

router.get(
    '/question/question-form',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionController.download,
);

router.delete(
    '/questions',
    isAuth.validateToken,
    validateAdmin.checkRole,
    questionController.deleteQuestion,
);

// Feedback apis
router.get(
    '/feedbacks',
    isAuth.validateToken,
    validateAdmin.checkRole,
    feedbackController.indexFeedbacks,
);

router.delete(
    '/feedbacks',
    isAuth.validateToken,
    validateAdmin.checkRole,
    feedbackController.deleteFeedbacks,
);

router.post(
    '/feedbacks/:id',
    isAuth.validateToken,
    validateAdmin.checkRole,
    validateFeedback.update(),
    feedbackController.sendFeedback,
);

router.get(
    '/feedbacks/:id',
    isAuth.validateToken,
    validateAdmin.checkRole,
    feedbackController.getDetailFeedback,
);

// Education apis
router.get(
    '/educations',
    isAuth.validateToken,
    validateAdmin.checkRole,
    educationController.indexEducations,
);

router.get(
    '/educations-parent',
    isAuth.validateToken,
    validateAdmin.checkRole,
    educationController.getAllEducationParent,
);

router.post(
    '/educations',
    isAuth.validateToken,
    validateAdmin.checkRole,
    educationController.created,
);

router.get(
    '/educations/:id',
    isAuth.validateToken,
    validateAdmin.checkRole,
    educationController.getDetailEducation,
);

router.put(
    '/educations/:id',
    isAuth.validateToken,
    validateAdmin.checkRole,
    educationController.updated,
);

router.delete(
    '/educations/:id',
    isAuth.validateToken,
    validateAdmin.checkRole,
    educationController.deleted,
);

// file
router.get('/files', isAuth.validateToken, validateAdmin.checkRole, fileController.indexFiles);

// images upload
router.post('/image-upload', imagesUploadController.imageUpload);

// history ranking
router.post(
    '/history-ranking',
    isAuth.validateToken,
    validateAdmin.checkRole,
    histRankingController.create,
);

// Dashboard
router.get(
    '/dashboard',
    isAuth.validateToken,
    validateAdmin.checkRole,
    accountController.dashboard,
);

router.get(
    '/dashboard/chart-study-results',
    isAuth.validateToken,
    validateAdmin.checkRole,
    accountController.chartStudyResults,
);

router.get(
    '/dashboard/chart-used-time-app',
    isAuth.validateToken,
    validateAdmin.checkRole,
    accountController.chartTimeUsingTheApp,
);

// feedback receiver
router.get(
    '/receiver-feedback/indexs',
    isAuth.validateToken,
    authorize(AdminRole),
    receiverFeedbackController.indexs,
);

router.get(
    '/receiver-feedback/detail/:id',
    isAuth.validateToken,
    authorize(AdminRole),
    receiverFeedbackController.getDetailUser,
);

router.post(
    '/receiver-feedback/create',
    isAuth.validateToken,
    authorize(AdminRole),
    receiverFeedbackController.add,
);

router.delete(
    '/receiver-feedback/delete/:id',
    isAuth.validateToken,
    authorize(AdminRole),
    receiverFeedbackController.removeReceiver,
);

module.exports = router;
