const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StatisticUsedTime = new Schema(
    {
        times: {
            type: Number,
            default: 0,
        },
        year: {
            type: Number,
            required: true,
        },
        month: {
            type: Number,
            required: true,
        },
        school_id: {
            type: Schema.Types.ObjectId,
            ref: 'Education',
            required: true,
        },
        faculty_id: {
            type: Schema.Types.ObjectId,
            ref: 'Education',
            required: true,
        },
        education_id: {
            type: Schema.Types.ObjectId,
            ref: 'Education',
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
module.exports = mongoose.model('StatisticUsedTime', StatisticUsedTime, 'statistic_used_times');
