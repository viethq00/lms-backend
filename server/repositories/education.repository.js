const {EducationModel} = require('../models');
const {EDUCATION_FIELD, IS_DELETED} = require('../utils/consts');

module.exports = {
    findAll: async function (findParams, pagination) {
        try {
            const educations = await EducationModel.find(findParams)
                .populate([
                    {
                        path: 'items',
                        match: {is_deleted: IS_DELETED.NOT_DELETED},
                        populate: [
                            {
                                path: 'items',
                                match: {is_deleted: IS_DELETED.NOT_DELETED},
                                populate: [
                                    {
                                        path: 'items',
                                        match: {is_deleted: IS_DELETED.NOT_DELETED},
                                    },
                                ],
                            },
                        ],
                    },
                ])
                .skip((pagination.page - 1) * pagination.perPage)
                .limit(pagination.perPage)
                .sort('-created_at');
            return educations;
        } catch (error) {
            return null;
        }
    },
    count: async function (where) {
        try {
            const count = await EducationModel.countDocuments(where);
            return count;
        } catch (error) {
            return error;
        }
    },
    create: async function (educationNew) {
        try {
            const education = await EducationModel.create(educationNew);
            return education;
        } catch (error) {
            return error;
        }
    },
    findById: async function (id) {
        const education = await EducationModel.findOne({_id: id})
            .populate({
                path: 'parent_id',
                model: 'Education',
                populate: {
                    path: 'parent_id',
                    model: 'Education',
                    populate: {
                        path: 'parent_id',
                        model: 'Education',
                    },
                },
            })
            .select(EDUCATION_FIELD);
        if (!education) {
            return null;
        }
        return education;
    },
    findOne: async function (input) {
        const edu = await EducationModel.findOne(input);
        if (!edu) {
            return null;
        }
        return edu;
    },
    getEducation: async function (id) {
        const education = await EducationModel.findOne({_id: id}).select(EDUCATION_FIELD);
        if (!education) {
            return null;
        }
        return education;
    },
    findByNameAndCode: async function (findParams) {
        const education = await EducationModel.findOne(findParams).select(EDUCATION_FIELD);
        if (!education) {
            return null;
        }
        return education;
    },
    update: async function (id, where) {
        try {
            await EducationModel.updateOne({_id: id}, {$set: where});
            const education = await EducationModel.findOne({_id: id});
            return education;
        } catch (error) {
            return error;
        }
    },
    delete: async function (id) {
        try {
            await EducationModel.updateOne({_id: id}, {$set: {is_deleted: IS_DELETED.DELETED}});
            const education = await EducationModel.findOne({_id: id});
            return education;
        } catch (error) {
            return error;
        }
    },
    getAllEducation: async function () {
        const education = await EducationModel.find({type: 3});
        if (!education) {
            return null;
        }
        return education;
    },
    getAllEducationParent: async function () {
        try {
            const educations = await EducationModel.find({parent_id: null})
                .populate([
                    {
                        path: 'items',
                        match: {is_deleted: IS_DELETED.NOT_DELETED},
                        populate: [
                            {
                                path: 'items',
                                match: {is_deleted: IS_DELETED.NOT_DELETED},
                                populate: [
                                    {
                                        path: 'items',
                                        match: {is_deleted: IS_DELETED.NOT_DELETED},
                                    },
                                ],
                            },
                        ],
                    },
                ])
                .sort('-created_at');
            return educations;
        } catch (error) {
            return null;
        }
    },
    getAllEducationWithParent: async function () {
        try {
            return EducationModel.find({type: 3}).populate({
                path: 'parent_id',
                model: 'Education',
                populate: {
                    path: 'parent_id',
                    model: 'Education',
                    populate: {
                        path: 'parent_id',
                        model: 'Education',
                    },
                },
            });
        } catch (error) {
            return [];
        }
    },
};
