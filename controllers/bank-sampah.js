const express = require('express');
const router = express.Router({ mergeParams: true })
const asyncFB = require('../models/async-firebird')

let view = {
	title: 'Bank Sampah',
	menu: 'Settings',
	submenu: 'bank',
	page: 'blank',
	url: 'bank-sampah',
	isfullwidth: null,
}

router.get('/', async function (req, res) {
	res.render('html', { view })
})

module.exports = router
