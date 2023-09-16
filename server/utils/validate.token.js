const jwt = require('jsonwebtoken');

module.exports = {
    validateToken: async (req, res, next) => {
        const authorizationHeader = req.headers.authorization;
        let result;
        if (authorizationHeader) {
            const token = authorizationHeader || authorizationHeader.split(' ')[1];

            try {
                result = jwt.verify(token, process.env.JWT_SECRET);
                req.decoded = result;
                next();
            } catch (err) {
                result = {
                    data: null,
                    message: 'Invalid signature',
                };
                res.status(401).send(result);
            }
        } else {
            result = {
                data: null,
                message: 'Authentication error. Token required.',
            };

            res.status(401).send(result);
        }
    },
    generateAccessToken: (user) => {
        const options = {
            expiresIn: process.env.EXPIRE_ACCESSTOKEN,
        };

        return jwt.sign(user, process.env.JWT_SECRET, options);
    },
    generateRefreshToken: (user) => {
        return jwt.sign(user, process.env.JWT_REFRESH_TOKEN, {expiresIn: process.env.EXPIRE_REFRESH_TOKEN});
    },
    verifyRefreshToken: (refreshToken) => {
        try {
            return jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);
        } catch (err) {
            return null;
        }
    },
};
