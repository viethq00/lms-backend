const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StatisticSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        current_level: {
            type: Number
        },
        child_type: {
            type: Object,
        },
        root_type: {
            type: Object,
        },
        rank: {
            type: String,
            trim: true,
        },
        total_correct: {
            type: Number,
        },
        date_rank:{
            type: Date,
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
module.exports = mongoose.model('Statistic', StatisticSchema);
