const mediaRepository = require('../../repositories/media.repository');
const logger = require('../../utils/logger');
const {handlerSuccess} = require('../../utils/handler.response');
const {getHeaders} = require('../../utils/helper');
const {URL_BASE} = require('../../utils/consts');

module.exports = {
    classname: 'MediaController',

    /**
     * Function list file
     * @author    Linhhtm
     * @date      2021/11/12
     */
    async indexFiles(req, res, next) {
        try {
            const count = await mediaRepository.count();
            const responseHeaders = getHeaders(count, 0, 0);

            const files = await mediaRepository.findAll();

            if (files.length !== 0) {
                files.forEach((element) => {
                    const index = element.path_file.indexOf('.');
                    const mimetype = element.path_file.substring(index + 1);
                    mimetype === 'mp4'
                        ? (element.path_file = URL_BASE + 'animation/' + element.path_file)
                        : (element.path_file = URL_BASE + 'image/' + element.path_file);
                });
            }

            return handlerSuccess(req, res, {
                items: files,
                headers: responseHeaders,
            });
        } catch (error) {
            logger.error(new Error(error));
            next(error);
        }
    },
};
