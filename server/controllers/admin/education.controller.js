const educationRepository = require('../../repositories/education.repository');
const userRepository = require('../../repositories/user.repository');
const {validationResult} = require('express-validator');
const ErrorMessage = require('../../utils/errorMessage').ErrorMessage;
const {_errorFormatter, getHeaders} = require('../../utils/helper');
const logger = require('../../utils/logger');
const {
    handlerSuccess,
    handlerBadRequestError,
    handlerNotFoundError,
} = require('../../utils/handler.response');
const {IS_DELETED, TYPE_EDUCATION, USER_STATUS} = require('../../utils/consts');

module.exports = {
    classname: 'EducationController',

    /**
     * Function create education
     * @author    LinhHTM
     * @date      2022/01/19
     */
    created: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsg = _errorFormatter(errors.array());
            return handlerBadRequestError(req, res, errorMsg);
        }

        try {
            const newEducation = {
                name: req.body.name,
                code: req.body.code,
                parent_id: req.body.parent_id,
            };

            const education = await educationRepository.findByNameAndCode({
                $or: [{name: req.body.name}, {code: req.body.code}],
            });
            if (!req.body.parent_id) {
                if (education) {
                    return handlerBadRequestError(
                        req,
                        res,
                        ErrorMessage.EDUCATION_IS_ALREADY_EXISTED,
                    );
                }
            } else {
                const findByNameOrCode = {$or: [{name: req.body.name}, {code: req.body.code}]};
                const educationParent = await educationRepository.findByNameAndCode({
                    $and: [findByNameOrCode, {parent_id: req.body.parent_id}],
                });
                if (educationParent) {
                    return handlerBadRequestError(
                        req,
                        res,
                        ErrorMessage.EDUCATION_IS_ALREADY_EXISTED,
                    );
                }
            }

            // get type
            if (!req.body.parent_id) {
                newEducation.type = TYPE_EDUCATION.EDUCATION;
            } else {
                const edu = await educationRepository.getEducation(req.body.parent_id);
                if (!edu.parent_id) {
                    newEducation.type = TYPE_EDUCATION.MAJORS;
                } else {
                    newEducation.type = TYPE_EDUCATION.YEAR;
                }
            }

            const createEducation = await educationRepository.create(newEducation);
            return handlerSuccess(req, res, createEducation);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function list education
     * @author    Linhhtm
     * @date      2022/01/20
     */
    async indexEducations(req, res, next) {
        try {
            const findParams = {
                parent_id: null,
                is_deleted: IS_DELETED.NOT_DELETED,
            };
            const page = +req.query.page || 1;
            const perPage = +req.query.limit || 20;

            const count = await educationRepository.count(findParams);
            const responseHeaders = getHeaders(count, page, perPage);

            const educations = await educationRepository.findAll(findParams, {page, perPage});
            const result = [];
            for (let i = 0; i < educations.length; i++) {
                const number = await userRepository.count({
                    schools: educations[i]._id,
                    status: {$ne: USER_STATUS.SUSPEND},
                });
                const education = {
                    _id: educations[i]._id,
                    name: educations[i].name,
                    code: educations[i].code,
                    parent_id: educations[i].parent_id,
                    type: educations[i].type,
                    is_deleted: educations[i].is_deleted,
                    created_at: educations[i].created_at,
                    updated_at: educations[i].updated_at,
                    number: number,
                    items: await getEducation(educations[i].items),
                };
                result.push(education);
            }

            return handlerSuccess(req, res, {
                items: result,
                headers: responseHeaders,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function detail education
     * @author    Linhhtm
     * @date      2022/01/21
     */
    getDetailEducation: async (req, res, next) => {
        try {
            const education = await educationRepository.findById(req.params.id);
            if (!education) {
                return handlerNotFoundError(req, res, ErrorMessage.EDUCATION_IS_NOT_FOUND);
            }

            return handlerSuccess(req, res, education);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function updated education
     * @author    Linhhtm
     * @date      2022/01/22
     */
    async updated(req, res, next) {
        try {
            const education = await educationRepository.findById(req.params.id);
            if (!education) {
                return handlerNotFoundError(req, res, ErrorMessage.EDUCATION_IS_NOT_FOUND);
            }

            if (education.is_deleted === IS_DELETED.DELETED) {
                return handlerBadRequestError(req, res, ErrorMessage.EDUCATION_IS_NOT_UPDATED);
            } else {
                const data = req.body;
                const educationFind = await educationRepository.findByNameAndCode({
                    $or: [
                        {name: data.name === education.name ? '' : data.name},
                        {code: data.code === education.code ? '' : data.code},
                    ],
                });
                if (!data.parent_id) {
                    if (educationFind) {
                        return handlerBadRequestError(
                            req,
                            res,
                            ErrorMessage.EDUCATION_IS_ALREADY_EXISTED,
                        );
                    }
                } else {
                    const findByNameOrCode = {$or: [{name: data.name}, {code: data.code}]};
                    const educationParent = await educationRepository.findByNameAndCode({
                        $and: [findByNameOrCode, {parent_id: data.parent_id}],
                    });
                    if (
                        educationParent &&
                        JSON.stringify(educationParent._id) !== JSON.stringify(req.params.id)
                    ) {
                        return handlerBadRequestError(
                            req,
                            res,
                            ErrorMessage.EDUCATION_IS_ALREADY_EXISTED,
                        );
                    }
                }

                // get type
                if (!req.body.parent_id) {
                    data.type = TYPE_EDUCATION.EDUCATION;
                } else {
                    const edu = await educationRepository.getEducation(req.body.parent_id);
                    if (!edu.parent_id) {
                        data.type = TYPE_EDUCATION.MAJORS;
                    } else {
                        data.type = TYPE_EDUCATION.YEAR;
                    }
                }

                const update = await educationRepository.update(req.params.id, data);
                if (!update) {
                    return handlerBadRequestError(req, res, ErrorMessage.EDUCATION_IS_NOT_UPDATED);
                }

                return handlerSuccess(req, res, update);
            }
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function delete education
     * @author    Linhhtm
     * @date      2022/01/26
     */
    async deleted(req, res, next) {
        try {
            const education = await educationRepository.findById(req.params.id);
            if (!education) {
                return handlerNotFoundError(req, res, ErrorMessage.EDUCATION_IS_NOT_FOUND);
            }
            const numberSchools = await userRepository.count({schools: req.params.id});
            const numberFaculty = await userRepository.count({faculty: req.params.id});
            const numberEducation = await userRepository.count({education_id: req.params.id});
            if (numberSchools === 0 || numberFaculty === 0 || numberEducation === 0) {
                const deletedEducation = await educationRepository.delete(req.params.id);
                return handlerSuccess(req, res, deletedEducation);
            } else {
                return handlerBadRequestError(req, res, ErrorMessage.EDUCATION_IS_NOT_DELETED);
            }
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },

    /**
     * Function list education all not filter
     * @author    Linhhtm
     * @date      2021/12/01
     */
    async getAllEducationParent(req, res, next) {
        try {
            const educations = await educationRepository.getAllEducationParent();
            return handlerSuccess(req, res, educations);
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },
};

async function getEducation(educations) {
    const result = [];
    for (let i = 0; i < educations.length; i++) {
        const numberFaculty = await userRepository.count({
            faculty: educations[i]._id,
            status: {$ne: USER_STATUS.SUSPEND},
        });
        const array = [];
        for (let j = 0; j < educations[i].items.length; j++) {
            const number = await userRepository.count({
                education_id: educations[i].items[j]._id,
                status: {$ne: USER_STATUS.SUSPEND},
            });
            array.push({
                _id: educations[i].items[j]._id,
                name: educations[i].items[j].name,
                code: educations[i].items[j].code,
                parent_id: educations[i].items[j].parent_id,
                type: educations[i].items[j].type,
                is_deleted: educations[i].items[j].is_deleted,
                created_at: educations[i].items[j].created_at,
                updated_at: educations[i].items[j].updated_at,
                number: number,
            });
        }
        result.push({
            _id: educations[i]._id,
            name: educations[i].name,
            code: educations[i].code,
            parent_id: educations[i].parent_id,
            type: educations[i].type,
            is_deleted: educations[i].is_deleted,
            created_at: educations[i].created_at,
            updated_at: educations[i].updated_at,
            number: numberFaculty,
            items: array,
        });
    }
    return result;
}
