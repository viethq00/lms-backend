const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {IS_DELETED, TYPE_EDUCATION} = require('../utils/consts');

const EducationSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        code: {
            type: String,
            trim: true,
        },
        parent_id: {
            type: Schema.Types.ObjectId,
            ref: 'Education',
        },
        type: {
            type: Number,
            enum: TYPE_EDUCATION,
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
            default: Date.now,
        },
    }
);
EducationSchema.virtual('items', {
    ref: 'Education',
    localField: '_id',
    foreignField: 'parent_id',
    justOne: false
});

EducationSchema.set('toObject', { virtuals: true });
EducationSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Education', EducationSchema);
