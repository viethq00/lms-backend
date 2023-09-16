const {body} = require('express-validator');

module.exports = {
    classname: 'ValidateFeedback',

    create: () => {
        return [body('question').not().isEmpty().withMessage('質問のパラメータがありません')];
    },

    update: () => {
        return [body('answer').not().isEmpty().withMessage('回答のパラメータがありません')];
    },
};
