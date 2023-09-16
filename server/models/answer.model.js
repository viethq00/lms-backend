const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {USER_ANSWER} = require('../utils/consts');

const AnswerSchema = new Schema(
    {
        question_id: {
            type: Schema.Types.ObjectId,
            ref: 'Question',
            required: true,
        },
        user_answer: {
            type: Number,
            enum: USER_ANSWER,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
        updated_at: {
            type: Date,
            default: Date.now,
        },
    },
    {usePushEach: true},
);
module.exports = mongoose.model('Answer', AnswerSchema);
