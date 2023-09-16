const {UserModel} = require('../models');
const {USER_FIELD, USER_DETAIL_FIELD, USER_STATUS, USER_FIELD_LIST} = require('../utils/consts');
const {StatisticModel, EducationModel} = require('../models');

module.exports = {
    findByEmail: async function (email) {
        const user = await UserModel.findOne({email: email});
        if (!user) {
            return null;
        }
        return user;
    },
    findByPersonalId: async function (personalId) {
        const user = await UserModel.findOne({personal_id: personalId});
        if (!user) {
            return null;
        }
        return user;
    },
    findByEmailOrUsername: async function (findParams) {
        const user = await UserModel.findOne(findParams).select(USER_FIELD);
        if (!user) {
            return null;
        }
        return user;
    },
    findByUsername: async function (username) {
        const user = await UserModel.findOne({username: username});
        if (!user) {
            return null;
        }
        return user;
    },
    findByCode: async function (code) {
        const user = await UserModel.findOne({code: code}).select(USER_DETAIL_FIELD);
        if (!user) {
            return null;
        }
        return user;
    },
    findById: async function (id) {
        const user = await UserModel.findOne({_id: id}).select(USER_DETAIL_FIELD);
        if (!user) {
            return null;
        }
        return user;
    },
    findAll: async function (findParams, pagination) {
        try {
            const user = await UserModel.find(findParams)
                .select(USER_FIELD_LIST)
                .skip((pagination.page - 1) * pagination.perPage)
                .limit(pagination.perPage)
                .sort('-created_at');
            return user;
        } catch (error) {
            return null;
        }
    },
    findAllUser: async function (findParams) {
        try {
            const user = await UserModel.find(findParams).select(USER_FIELD_LIST);
            return user;
        } catch (error) {
            return null;
        }
    },
    findAllCSV: async function (findParams) {
        try {
            const user = await UserModel.find(findParams)
                .select(USER_FIELD_LIST)
                .sort('-created_at');
            return user;
        } catch (error) {
            return null;
        }
    },
    create: async function (newAcc) {
        const user = await UserModel.create(newAcc);
        if (!user) {
            return null;
        }
        return {
            _id: user.id,
            full_name: user.full_name,
            username: user.username,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };
    },
    count: async function (where) {
        try {
            const count = await UserModel.countDocuments(where);
            return count;
        } catch (error) {
            return error;
        }
    },
    update: async function (id, where) {
        try {
            await UserModel.updateOne({_id: id}, {$set: where});
            const user = await UserModel.findOne({_id: id});
            return user;
        } catch (error) {
            return error;
        }
    },
    deleteMany: async function (ids) {
        try {
            const user = await UserModel.updateMany(
                {_id: {$in: ids}, status: {$ne: USER_STATUS.SUSPEND}},
                {status: USER_STATUS.SUSPEND},
                {new: true},
            );
            return user;
        } catch (error) {
            return error;
        }
    },
    findAllWithArrayIds: async function (ids) {
        try {
            const users = await UserModel.find({_id: {$in: ids}});
            return users;
        } catch (error) {
            return error;
        }
    },
    findAllWithEducation: async function (findParams) {
        try {
            const users = await UserModel.find(findParams);
            return users;
        } catch (error) {
            return error;
        }
    },
    importUserFromExcel: async function (userRow) {
        const userNotImport = [];
        const userNews = [];
        for (const item of userRow) {
            const name = item.name;
            const personal_id = item.personalId;
            const email = item.email;
            const expiration_date = item.expirationAt;
            const userNew = {};
            const userError = {
                index: null,
                error: null,
            };
            if (!name || !personal_id || !email || !expiration_date) {
                userError.index = item.id;
                userError.error = 'Infor user is not enought!';
                userNotImport.push(userError);
                continue;
            }
            if (personal_id.length < 6 || personal_id.length > 14) {
                userError.index = item.id;
                userError.error = 'PersonalId is not match!';
                userNotImport.push(userError);
                continue;
            }

            userNew.full_name = name;
            userNew.personal_id = personal_id;
            userNew.email = email;
            userNew.password = personal_id;
            userNew.expiration_date = expiration_date;

            const userInfor = await checkPersonalId(personal_id);

            if (!userInfor) {
                userError.index = item.id;
                userError.error =
                    'Personal id is not match (schools or faculty or education id is not match)!';
                userNotImport.push(userError);
                continue;
            }

            userNew.schools = userInfor.schools;
            userNew.faculty = userInfor.faculty;
            userNew.education_id = userInfor.education_id;

            // check email and personal id
            const user = await UserModel.findOne({
                $or: [{email: email}, {personal_id: personal_id}],
            });
            if (user) {
                userError.index = item.id;
                userError.error = 'Personal id or email was duplicated!';
                userNotImport.push(userError);
                continue;
            }

            const userCreated = await UserModel.create(userNew);
            const statisticNew = newStatistic(userCreated._id);
            await StatisticModel.create(statisticNew);
            userNews.push(userNew);
        }

        return {
            userImport: userNews.length,
            userNotImport,
        };
    },
};

function newStatistic(id) {
    return {
        user_id: id,
        child_type: {
            child_type_A: 0,
            child_type_B: 0,
            child_type_C: 0,
            child_type_D: 0,
            child_type_E: 0,
            child_type_F: 0,
        },
        root_type: {
            root_type_A: 0,
            root_type_B: 0,
            root_type_C: 0,
            root_type_D: 0,
            root_type_E: 0,
            root_type_F: 0,
        },
    };
}

async function checkPersonalId(id) {
    const schoolId = id.slice(0, 5);
    const facultyId = id.slice(6, 8);
    const eduId = id.slice(8, 10);

    const user = {};
    const eduSchools = await EducationModel.findOne({
        code: schoolId,
    });
    if (!eduSchools) {
        return null;
    }
    user.schools = eduSchools._id;
    const eduFaculty = await EducationModel.findOne({
        code: facultyId,
        parent_id: eduSchools._id,
    });
    if (!eduFaculty) {
        return null;
    }
    user.faculty = eduFaculty._id;
    const eduYear = await EducationModel.findOne({
        code: eduId,
        parent_id: eduFaculty._id,
    });
    if (!eduYear) {
        return null;
    }
    user.education_id = eduYear._id;

    return user;
}
