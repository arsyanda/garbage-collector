const express = require('express');
const router = express.Router({ mergeParams: true })
const asyncFB = require('../models/async-firebird')

let view = {
	title: 'Blank',
	menu: 'Settings',
	submenu: 'Blank',
	page: 'blank',
	url: 'blank',
	isfullwidth: null,
}

router.get('/', async function (req, res) {
	res.render('html', { view })
})

module.exports = router
