require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const i18n = require('i18n');
const mongoose = require('mongoose');
const fs = require('fs');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin.apis');
const userRouter = require('./routes/user.apis');
const rateLimit = require('express-rate-limit');
const {MONGODB} = require('./utils/env');
const nodeCron = require('node-cron');
const {updateStatusUserExpiration} = require('./controllers/admin/account.controller');
const {createHistoryRanking} = require('./controllers/admin/history_ranking.controller');
const basicAuth = require('express-basic-auth');
const {getAllEducation} = require('./repositories/education.repository');
const {crowData} = require('./repositories/statistic_used_time.repository');
// Create the rate limit rule
const apiRequestLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 80, // limit each IP to 2 requests per windowMs
    handler: function (req, res /*next*/) {
        return res.status(429).json({
            error: 'You sent too many requests. Please wait a while then try again',
        });
    },
});

const app = express();

// 0 0 * * * every day
nodeCron.schedule('0 0 * * *', async function jobYouNeedToExecute() {
    await updateStatusUserExpiration();
});

// 0 0 1 * * every month
nodeCron.schedule('0 0 1 * * ', async function jobYouNeedToExecute() {
    const listEducation = await getAllEducation();
    const eduIds = listEducation.map((item) => item._id);

    for (const item of eduIds) {
        await createHistoryRanking(item);
    }
});

// enabling cors
app.use(cors());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const docs = yaml.safeLoad(fs.readFileSync('./docs/swagger.yml', 'utf8'));
app.use(
    '/docs',
    basicAuth({
        users: {admin: 'password1'},
        challenge: true,
    }),
    swaggerUi.serve,
    swaggerUi.setup(docs),
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

// initialize language package
app.use(i18n.init);
mongoose.connect(MONGODB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false,
});
// config language package
i18n.configure({
    locales: ['en', 'vi', 'ko'],
    directory: __dirname + '/locales',
    defaultLocale: 'en',
});

app.use(apiRequestLimiter);
app.use('/', indexRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);

// serve static files
app.use('/images', express.static('images'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
    next();
});
crowData();

module.exports = app;
