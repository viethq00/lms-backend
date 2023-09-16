const util = require('util');
const multer = require('multer');
const maxSizeImage = 10 * 1024 * 1024;
const maxSizeAnimation = 200 * 1024 * 1024;
const commonFunctions = require('../utils/common_functions');

// Upload image
const storageImage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.cwd() + '/uploads/image/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const uploadImage = multer({
    storage: storageImage,
    limits: {fileSize: maxSizeImage},
    fileFilter: (req, file, cb) => {
        if (commonFunctions.checkFileImageExists(file.originalname)) {
            cb(null, false);
        } else {
            cb(null, true);
        }
    },
}).single('file');

const uploadFileMiddlewareImage = util.promisify(uploadImage);

// Upload animation
const storageAnimation = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.cwd() + '/uploads/animation/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const uploadAnimation = multer({
    storage: storageAnimation,
    limits: {fileSize: maxSizeAnimation},
    fileFilter: (req, file, cb) => {
        if (commonFunctions.checkFileAnimationExists(file.originalname)) {
            cb(null, false);
        } else {
            cb(null, true);
        }
    },
}).single('file');

const uploadFileMiddlewareAnimation = util.promisify(uploadAnimation);

module.exports = {
    uploadFileMiddlewareImage,
    uploadFileMiddlewareAnimation,
};
