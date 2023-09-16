const {MediaModel} = require('../models');

module.exports = {
    findAll: async function () {
        try {
            const medias = await MediaModel.find();
            return medias;
        } catch (error) {
            return null;
        }
    },
    count: async function () {
        try {
            const count = await MediaModel.countDocuments();
            return count;
        } catch (error) {
            return error;
        }
    },
    create: async function (mediaNew) {
        try {
            const media = await MediaModel.create(mediaNew);
            return media;
        } catch (error) {
            return error;
        }
    },
};
