const express = require('express');
const router = express.Router({ mergeParams: true });
const asyncFB = require('../models/async-firebird');

///////////////////////// Parameter yang harus diganti ////////////////////////////
// Sesuaikan dengan halaman
let view = {
	title: 'Role',
	menu: 'Settings',
	submenu: 'Role',
	page: 'crud',
	url: 'role',
	isfullwidth: null,
};

// Sesuaikan dengan database
let vdata = {
    table : 'TB_ROLE',
    columns_name : ['ID', 'Nama Role'],
    columns : ['ROLE_RID', 'ROLE_NAME'],
    types : ['id', 'text'],
    values : ['', ''],
    isreqs : ['', 'required'],
}
///////////////////////////////////////////////////////////////////////////////////

router.get('/', function (req, res) {
    view.page = 'crud'
	res.render('html', { view, vdata });
});

router.get('/create', function (req, res) {
    view.page = 'crud-create'
	res.render('html', { view, vdata });
});

router.get('/update/:id', async function (req, res) {
	let s1 = `select * from ${vdata.table} where ${view.title}_rid=?`
	let p1 = [req.params.id]
	let r1 = await asyncFB.doQuery(s1, p1)
    view.page = 'crud-update'
	res.render('html', { view, vdata, r1 });
});

router.get('/data', async function (req, res) {
	let s1 = `select * from ${vdata.table}`
	let p1 = [req.fields.user, req.fields.pass]
	let r1 = await asyncFB.doQuery(s1, p1)
	res.json(r1);
});

router.get('/delete/:id', async function (req, res, next) {
	if (!req.session.login) {
		res.redirect('/login/logout');
	} else {
		try {
			rs = await asyncFB.doQuery(`delete from ${vdata.table} where ${view.url}_rid=?`, [req.params.id]);
			req.flash(`success`, `Berhasil menghapus data`);
		} catch (err) {
			console.log(err);
			req.flash(`error`, `Gagal menghapus data<br><br><small>${err.stack.split(' at')[0]}</small>`);
		} finally {
			res.redirect(`/${view.url}`);
		}
	}
});

router.post('/create', async function (req, res, next) {
	if (!req.session.login) {
		res.redirect('/login/logout');
	} else {
		try {
			kolom = Object.keys(req.fields).join(', ');
			nilai = `'` + Object.values(req.fields).join(`', '`) + `'`;
			kolom1 = Object.keys(req.files).join(', ');
			docs = [];
			for (const property in req.files) {
				if (String(req.files[property].path.split('uploads/')[1]).includes('.')) {
					data = req.files[property].path.split('uploads/')[1];
					docs.push(data);
				} else {
					data = '';
					docs.push(data);
				}
			}
			nilai1 = `'` + docs.join(`', '`) + `'`;
			if (kolom1 && nilai1) {
				kolom = kolom + ',' + kolom1;
				nilai = nilai + ',' + nilai1;
			}
			rs = await asyncFB.doQuery(`insert into ${vdata.table} ( ${kolom} ) values ( ${nilai} )`, []);
			req.flash(`success`, `Berhasil menambahkan data`);
		} catch (err) {
			console.log(err);
			req.flash(`error`, `Gagal menambahkan data<br><br><small>${err.stack.split(' at')[0]}</small>`);
		} finally {
			res.redirect(`/${view.url}`);
		}
	}
});

router.post('/update', async function (req, res, next) {
	if (!req.session.login) {
		res.redirect('/login/logout');
	} else {
		try {
			var items = [];
			for (const property in req.fields) {
				data = property + ` = '` + req.fields[property] + `'`;
				items.push(data);
			}
			updateset = items.join(', ');
			var docs = [];
			for (const property in req.files) {
				if (String(req.files[property].path.split('uploads/')[1]).includes('.')) {
					data = property + ` = '` + req.files[property].path.split('uploads/')[1] + `'`;
					docs.push(data);
				}
			}
			updatedoc = docs.join(', ');
			rs = await asyncFB.doQuery(`update ${vdata.table} set ${updateset} where ${view.url}_rid='${req.fields[`${view.url.toUpperCase()}_RID`]}'`, []);
			if (docs.length > 0) {
				rs1 = await asyncFB.doQuery(`update ${vdata.table} set ${updatedoc} where ${view.url}_id='${req.fields[`${view.url.toUpperCase()}_RID`]}'`, []);
			}
			req.flash(`success`, `Berhasil mengubah data`);
		} catch (err) {
			console.log(err);
			req.flash(`error`, `Gagal mengubah data<br><br><small>${err.stack.split(' at')[0]}</small>`);
		} finally {
			res.redirect(`/${view.url}`);
		}
	}
});
module.exports = router;
