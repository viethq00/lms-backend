const {ErrorMessage} = require('../utils/errorMessage');
const {handlerPermissionDeniedError} = require('../utils/handler.response');

module.exports = authorize;

function authorize(roles = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        (req, res, next) => {
            if (!roles.includes(req.decoded.role)) {
                return handlerPermissionDeniedError(req, res, ErrorMessage.PERMISSION_DENIED);
            }

            next();
        },
    ];
}
