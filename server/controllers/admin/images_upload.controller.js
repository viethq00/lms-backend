const {validationResult} = require('express-validator');
const uploadFile = require('../../repositories/upload_image.repository');
const mediaRepository = require('../../repositories/media.repository');
const logger = require('../../utils/logger');
const {
    handlerSuccess,
    handlerBadRequestError,
    handlerInternalServerError,
} = require('../../utils/handler.response');
const {URL_BASE} = require('../../utils/consts');
const ErrorMessage = require('../../utils/errorMessage').ErrorMessage;

module.exports = {
    classname: 'ImagesUploadController',

    _errorFormatter: (errors) => {
        const res = [];

        for (let i = 0; i < errors.length; i++) {
            res.push(errors[i].msg);
        }

        return res.join('. ');
    },

    /**
     * Function upload file image and animation
     * @author    Linhhtm
     * @date      2021/11/30
     */
    imageUpload: async (req, res, next) => {
        const mimetype = req.query.mimetype;
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                const errorMsg = module.exports._errorFormatter(errors.array());
                return handlerBadRequestError(req, res, errorMsg);
            }
            // upload file
            if (mimetype === 'video/mp4') {
                await uploadFile.uploadFileMiddlewareAnimation(req, res);
            } else {
                await uploadFile.uploadFileMiddlewareImage(req, res);
            }

            if (!req.file) {
                return handlerInternalServerError(req, res, ErrorMessage.FILE_IS_ALREADY_EXISTED);
            }
            const path =
                req.file.mimetype === 'video/mp4'
                    ? URL_BASE + 'animation/' + req.file.originalname
                    : URL_BASE + 'image/' + req.file.originalname;
            // save media
            await mediaRepository.create({path_file: req.file.originalname});

            return handlerSuccess(req, res, path);
        } catch (error) {
            if (error.code == 'LIMIT_FILE_SIZE') {
                if (mimetype === 'video/mp4') {
                    return handlerInternalServerError(
                        req,
                        res,
                        ErrorMessage.MAX_SIZE_FILE_ANIMATION,
                    );
                } else {
                    return handlerInternalServerError(req, res, ErrorMessage.MAX_SIZE_FILE_IMAGE);
                }
            }
            logger.error(new Error(error));
            next(error);
        }
    },
};
