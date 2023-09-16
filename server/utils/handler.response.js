module.exports = {
    handlerSuccess(req, res, data) {
        res.status(200).send({
            data: data,
            message: 'done!',
        });
    },

    handlerBadRequestError(req, res, message) {
        res.status(400).send({
            data: null,
            message: `${message}`,
        });
    },

    handlerUnauthorizedError(req, res, message) {
        res.status(401).send({
            data: null,
            message: `${message}`,
        });
    },

    handlerPermissionDeniedError(req, res, message) {
        res.status(403).send({
            data: null,
            message: `${message}`,
        });
    },

    handlerNotFoundError(req, res, message) {
        res.status(404).send({
            data: null,
            message: `${message}`,
        });
    },

    handlerInternalServerError(req, res, message) {
        res.status(500).send({
            data: null,
            message: `${message}`,
        });
    },
};
