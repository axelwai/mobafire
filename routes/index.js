const express = require('express');
const router = express.Router();

const data = require('../resource/test.json');

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {
		'title': 'Index',
		'champs': data.champs,
		'items': data.items
	});
});

module.exports = router;
