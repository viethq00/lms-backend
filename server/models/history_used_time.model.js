const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HistoryUsedTimeSchema = new Schema(
    {
        used_time: {
            type: String,
            trim: true,
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
    },
    {usePushEach: true},
);
module.exports = mongoose.model('History_Used_Time', HistoryUsedTimeSchema);
