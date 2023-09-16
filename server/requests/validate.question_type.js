const {body} = require('express-validator');

module.exports = {
    classname: 'ValidateQuestionType',

    create: () => {
        return [body('name').not().isEmpty().withMessage('ネームパラメータがありません')];
    },
};
