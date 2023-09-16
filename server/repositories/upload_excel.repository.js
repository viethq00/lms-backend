const util = require('util');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.cwd() + '/uploads/file_import/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const uploadFile = multer({
    storage: storage,
}).single('file');

const uploadFileMiddleware = util.promisify(uploadFile);

module.exports = uploadFileMiddleware;
