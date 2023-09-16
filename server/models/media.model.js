const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MediaSchema = new Schema(
    {
        path_file: {
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
module.exports = mongoose.model('Media', MediaSchema);
