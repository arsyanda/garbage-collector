const express = require('express');
const router = express.Router({ mergeParams: true });
const asyncFB = require('../models/async-firebird');

let baseView = {
	title: 'Home',
	menu: '',
	submenu: '',
	page: '',
	isfullwidth: null,
}

let vdata = {
    table : 'TB_USER',
    columns_name : ['ID', 'Username', 'Password', 'Role', 'Nama', 'Email', 'Telp', 'Dibuat', 'Diubah', 'Diubah Oleh'],
    columns : ['USER_RID', 'USER_USERNAME', 'USER_PASSWORD', 'USER_ROLE', 'USER_NAME', 'USER_EMAIL', 'USER_PHONE', 'USER_CREATED', 'USER_UPDATED', 'USER_BY'],
    types : ['id', 'text', 'text', 'select', 'text', 'email', 'text', 'disabled', 'disabled', 'hidden'],
    values : ['', '', '', '', '', '', '', '', '', ''],
    isreqs : ['', 'required', 'required', 'required', 'required', '', '', '', '', ''],
}

router.get('/home-pekerja', async function(req, res) {
    const view = { ...baseView, page: 'home-pekerja' };
    res.render('html', { view });
})

router.get('/home-admin', async function(req, res) {
    const view = { ...baseView, page: 'home-admin' };
    res.render('html', { view });
})

module.exports = router;   