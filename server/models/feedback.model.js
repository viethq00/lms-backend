const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {IS_DELETED} = require('../utils/consts');

const FeedbackSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        question: {
            type: String,
            trim: true
        },
        answer: {
            type: String,
            trim: true
        },
        is_deleted: {
            type: Number,
            enum: IS_DELETED,
            default: IS_DELETED.NOT_DELETED,
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
        updated_at: {
            type: Date,
        },
    }
);

module.exports = mongoose.model('Feedback', FeedbackSchema);
