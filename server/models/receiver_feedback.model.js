const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReceiverSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            match: [/.+@.+\..+/, 'Địa chỉ email không hợp lệ'],
        },
        schools: {
            type: Schema.Types.ObjectId,
            ref: 'Education',
            require: false,
        },
        faculty: {
            type: Schema.Types.ObjectId,
            ref: 'Education',
            require: false,
        },
        education_id: {
            type: Schema.Types.ObjectId,
            ref: 'Education',
            require: false,
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
ReceiverSchema.index({email: 1}, {background: true});

module.exports = mongoose.model('Receiver_Feedback', ReceiverSchema);
