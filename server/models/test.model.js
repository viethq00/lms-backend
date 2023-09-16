const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TestSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        question_ids: {
            type: Array,
        },
        root_type: {
            type: Schema.Types.ObjectId,
            ref: 'Question_Type',
        },
        spend_times: {
            type: Number,
        },
        score: {
            type: Number,
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
module.exports = mongoose.model('Test', TestSchema);
