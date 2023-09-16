const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HistoryRankingSchema = new Schema(
    {
        count: [
            {
                rank: String,
                count: Number,
            },
        ],
        schools: {
            type: String,
            trim: true,
        },
        faculty: {
            type: String,
            trim: true,
        },
        education_id: {
            type: String,
            trim: true,
        },
        month: {
            type: Number,
        },
        year: {
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
HistoryRankingSchema.index({education_id: 1}, {background: true});

module.exports = mongoose.model('History_Ranking', HistoryRankingSchema);
