const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {title: 'Home'});
});

router.get('/login', function (req, res) {
    res.render('login', {title: 'login'});
});

module.exports = router;
