const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;
const SALT_WORK_FACTOR = 10;
const {getValueInEnum} = require('../utils/helper');
const {USER_ROLES, USER_STATUS} = require('../utils/consts');

const UserSchema = new Schema(
    {
        full_name: {
            type: String,
            required: true,
            trim: true,
        },
        username: {
            type: String,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            match: [/.+@.+\..+/, 'Địa chỉ email không hợp lệ'],
        },
        personal_id: {
            type: String,
            unique: true,
            trim: true
        },
        role: {
            type: String,
            enum: getValueInEnum(USER_ROLES),
            default: USER_ROLES.USER,
        },
        password: {
            type: String,
            required: true,
            trim: true,
        },
        refresh_token: {
            type: String,
            required: false,
            trim: true,
        },
        access_token: {
            type: String,
            required: false,
            trim: true,
        },
        hightest_score: {
            type: Number,
        },
        furigana: {
            type: String,
            trim: true,
        },
        status: {
            type: Number,
            enum: USER_STATUS,
            default: USER_STATUS.ACTIVE,
        },
        code: {
            type: Number,
        },
        usage_time: {
            type: Number,
            default: 0,
        },
        expiration_date: {
            type: Date,
        },
        birthday: {
            type: Date,
        },
        occupation: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        course: {
            type: String,
            trim: true,
        },
        class: {
            type: String,
            trim: true,
        },
        schools: {
            type: Schema.Types.ObjectId,
            ref: 'Education',
        },
        faculty: {
            type: Schema.Types.ObjectId,
            ref: 'Education',
        },
        education_id: {
            type: Schema.Types.ObjectId,
            ref: 'Education',
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
UserSchema.index({email: 1}, {background: true});

UserSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) return next();
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function (candidatePassword) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(candidatePassword, this.password).then((data) => {
            return resolve(data);
        });
    });
};

module.exports = mongoose.model('User', UserSchema);
