const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {IMAGE_TYPE, LEVEL, QUESTION_STATUS} = require('../utils/consts');

const QuestionSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        level: {
            type: Number,
            enum: LEVEL,
            default: LEVEL.LEVEL_1,
        },
        root_type: {
            type: Schema.Types.ObjectId,
            ref: 'Question_Type',
            required: true,
        },
        child_type: {
            type: Schema.Types.ObjectId,
            ref: 'Question_Type',
            required: true,
        },
        last_type: {
            type: Schema.Types.ObjectId,
            ref: 'Question_Type',
            required: true,
        },
        question_type_id: {
            type: Schema.Types.ObjectId,
            ref: 'Question_Type',
            required: true,
        },
        image_type: {
            type: Number,
            enum: IMAGE_TYPE,
            default: IMAGE_TYPE.TEXT,
        },
        path_file: {
            type: String,
            trim: true,
        },
        option_1: {
            type: String,
            trim: true,
        },
        option_2: {
            type: String,
            trim: true,
        },
        option_3: {
            type: String,
            trim: true,
        },
        option_4: {
            type: String,
            trim: true,
        },
        correct_answer: {
            type: String,
            trim: true,
        },
        status: {
            type: Number,
            enum: QUESTION_STATUS,
            default: QUESTION_STATUS.ACTIVE,
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
module.exports = mongoose.model('Question', QuestionSchema);
