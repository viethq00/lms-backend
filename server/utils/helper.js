const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

exports._errorFormatter = (errors) => {
    const res = [];

    for (let i = 0; i < errors.length; i++) {
        res.push(errors[i].msg);
    }

    return res.join('. ');
};

exports.addMongooseParam = (mongooseObject = {}, key, value) => {
    if (!mongooseObject) {
        mongooseObject = {};
    }

    mongooseObject[key] = value;

    return mongooseObject;
};

exports.isEmptyObject = (value) => {
    return Object.keys(value).length === 0 && value.constructor === Object;
};

exports.getValueInEnum = (obj) => {
    const arrayVal = [];
    for (const property in obj) {
        arrayVal.push(`${obj[property]}`);
    }
    return arrayVal;
};

exports.checkObjectId = (id) => {
    return ObjectId.isValid(id);
};

exports.getHeaders = (totalCount, page, perPage) => {
    page = +page;
    perPage = +perPage;
    const pagesCount = Math.ceil(totalCount / perPage);

    return {
        'x-page': page,
        'x-total-count': totalCount,
        'x-pages-count': pagesCount,
        'x-per-page': perPage,
        'x-next-page': page === pagesCount ? page : page + 1,
    };
};

exports.addMongooseParam = (mongooseObject = {}, key, value) => {
    if (!mongooseObject) {
        mongooseObject = {};
    }

    mongooseObject[key] = value;

    return mongooseObject;
};

exports.checkExistedUser = async (repo, ids) => {
    const users = await repo.findAllWithArrayIds(ids);
    const errorIds = [];
    const existIds = [];

    users.forEach((element) => {
        existIds.push(element.id);
    });

    for (let i = 0; i < ids.length; i++) {
        if (existIds.includes(ids[i]) === false) {
            errorIds.push(ids[i]);
        }
    }

    return errorIds;
};

exports.checkExistedQuestion = async (repo, ids) => {
    const questions = await repo.findAllWithArrayIds(ids);
    const errorIds = [];
    const existIds = [];

    questions.forEach((element) => {
        existIds.push(element.id);
    });

    for (let i = 0; i < ids.length; i++) {
        if (existIds.includes(ids[i]) === false) {
            errorIds.push(ids[i]);
        }
    }

    return errorIds;
};

exports.checkExistedFeedback = async (repo, ids) => {
    const feedbacks = await repo.findAllWithArrayIds(ids);
    const errorIds = [];
    const existIds = [];

    feedbacks.forEach((element) => {
        existIds.push(element.id);
    });

    for (let i = 0; i < ids.length; i++) {
        if (existIds.includes(ids[i]) === false) {
            errorIds.push(ids[i]);
        }
    }

    return errorIds;
};
