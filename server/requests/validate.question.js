const {body} = require('express-validator');

module.exports = {
    classname: 'ValidateQuestion',

    createQuestion: () => {
        return [
            body('title').not().isEmpty().withMessage('タイトルパラメータがありません'),
            body('level').not().isEmpty().withMessage('レベルのパラメータがありません'),
            body('root_type').not().isEmpty().withMessage('大分類のパラメータがありません'),
            body('child_type').not().isEmpty().withMessage('中分類のパラメータがありません'),
            body('last_type').not().isEmpty().withMessage('小分類のパラメータがありません'),
            body('question_type_id').not().isEmpty().withMessage('分類のパラメータがありません'),
            body('image_type').not().isEmpty().withMessage('テスト種類のパラメータがありません'),
            body('option_1').not().isEmpty().withMessage('選択肢1のパラメータがありません'),
            body('option_2').not().isEmpty().withMessage('選択肢2のパラメータがありません'),
            body('option_3').not().isEmpty().withMessage('選択肢3のパラメータがありません'),
            body('option_4').not().isEmpty().withMessage('選択肢4のパラメータがありません'),
            body('correct_answer').not().isEmpty().withMessage('正解のパラメータがありません'),
        ];
    },

    updateQuestion: () => {
        return [
            body('title').not().isEmpty().withMessage('タイトルパラメータがありません'),
            body('level').not().isEmpty().withMessage('レベルのパラメータがありません'),
            body('root_type').not().isEmpty().withMessage('大分類のパラメータがありません'),
            body('child_type').not().isEmpty().withMessage('中分類のパラメータがありません'),
            body('last_type').not().isEmpty().withMessage('小分類のパラメータがありません'),
            body('question_type_id').not().isEmpty().withMessage('分類のパラメータがありません'),
            body('image_type').not().isEmpty().withMessage('テスト種類のパラメータがありません'),
            body('option_1').not().isEmpty().withMessage('選択肢1のパラメータがありません'),
            body('option_2').not().isEmpty().withMessage('選択肢2のパラメータがありません'),
            body('option_3').not().isEmpty().withMessage('選択肢3のパラメータがありません'),
            body('option_4').not().isEmpty().withMessage('選択肢4のパラメータがありません'),
            body('correct_answer').not().isEmpty().withMessage('正解のパラメータがありません'),
        ];
    },
};
