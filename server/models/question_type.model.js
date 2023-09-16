const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {QUESTION_TYPE_STATUS} = require('../utils/consts');

const QuestionTypeSchema = new Schema(
    {
        parent_id: {
            type: Schema.Types.ObjectId,
            ref: 'Question_Type',
        },
        name: {
            type: String,
            trim: true,
        },
        status: {
            type: Number,
            enum: QUESTION_TYPE_STATUS,
            default: QUESTION_TYPE_STATUS.ACTIVE,
        },
        symbol: {
            type: String,
            trim: true,
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

QuestionTypeSchema.virtual('items', {
    ref: 'Question_Type',
    localField: '_id',
    foreignField: 'parent_id',
    justOne: false
});

QuestionTypeSchema.set('toObject', { virtuals: true });
QuestionTypeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Question_Type', QuestionTypeSchema);
