const express = require('express');
const router = express.Router({ mergeParams: true });
const asyncFB = require('../models/async-firebird');

///////////////////////// Parameter yang harus diganti ////////////////////////////
let sel1 = {};
let sel2 = {};
let sel3 = {};
let sel4 = {};
let sel5 = {};

// Sesuaikan dengan halaman
let view = {
	title: 'User',
	menu: 'Settings',
	submenu: 'User',
	page: 'crud',
	url: 'user',
	isfullwidth: null,
};

// Sesuaikan dengan database
let vdata = {
    table : 'TB_USER',
    columns_name : ['ID', 'Username', 'Password', 'Role', 'Nama', 'Email', 'Telp', 'Dibuat', 'Diubah', 'Diubah Oleh'],
    columns : ['USER_RID', 'USER_USERNAME', 'USER_PASSWORD', 'USER_ROLE', 'USER_NAME', 'USER_EMAIL', 'USER_PHONE', 'USER_CREATED', 'USER_UPDATED', 'USER_BY'],
    types : ['id', 'text', 'text', 'select', 'text', 'email', 'text', 'disabled', 'disabled', 'hidden'],
    values : ['', '', '', '', '', '', '', '', '', ''],
    isreqs : ['', 'required', 'required', 'required', 'required', '', '', '', '', ''],
}
///////////////////////////////////////////////////////////////////////////////////

router.get('/', function (req, res) {
    view.page = 'crud'
	res.render('html', { view, vdata });
});

router.get('/create', async function (req, res) {
	rs = await asyncFB.doQuery(`SELECT role_rid as kode, role_name as nama FROM TB_ROLE`, []);
	for (let x in rs) { sel1[rs[x].KODE] = rs[x].NAMA; }
	vdata.values = ['', '', '', sel1, '', '', '', '', '', req.session.login.USER_USERNAME]
    view.page = 'crud-create'
	res.render('html', { view, vdata });
});

router.get('/update/:id', async function (req, res) {
	rs = await asyncFB.doQuery(`SELECT role_rid as kode, role_name as nama FROM TB_ROLE`, []);
	for (let x in rs) { sel1[rs[x].KODE] = rs[x].NAMA; }
	vdata.values = ['', '', '', sel1, '', '', '', '', '', req.session.login.USER_USERNAME]
	let s1 = `select * from ${vdata.table} where ${view.title}_rid=?`
	let p1 = [req.params.id]
	let r1 = await asyncFB.doQuery(s1, p1)
    view.page = 'crud-update'
	res.render('html', { view, vdata, r1 });
});

router.get('/data', async function (req, res) {
	let s1 = `select ${vdata.table}.*, role_name as user_role from ${vdata.table} inner join TB_ROLE on role_rid=user_role`
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
			req.flash(`error`, `Gagal mengubah data<br><br><small>${err.stack.split(' at')[0]}</small>`);
		} finally {
			res.redirect(`/${view.url}`);
		}
	}
});

router.get('/get-by-komplek/:komplekID', async function (req, res) {
	let s1 = `select * from ${vdata.table} where komplek=?`
	let p1 = [req.params.komplekID]
	let r1 = await asyncFB.doQuery(s1, p1)
	res.json(r1);
});

router.get('/get-alamat/:userID', async function (req, res) {
	let s1 = `select a.alamat_rid, a.jalan, a.kecamatan, a.kelurahan, a.kota, a.provinsi, a.kode_pos
	from TB_ALAMAT a INNER JOIN TB_USER u ON u.alamat = a.alamat_RID where user_rid=?`
	let p1 = [req.params.userID]
	let r1 = await asyncFB.doQuery(s1, p1)
	res.json(r1);
});

router.get('/total-petugas', async function (req, res) {
	try {
		let s1 = `
			SELECT COUNT(USER_RID) as JUMLAH
			FROM TB_USER
			WHERE USER_ROLE = ?
		`;
		let p1 = [2]
		let r1 = await asyncFB.doQuery(s1, p1)
		res.status(200).json(r1[0]);
	} catch {
		res.status(500).json({message: "Internal Server Error"})
	}
});

router.get('/pekerja-komplek/:komplekID', async function (req, res) {
	try {
		let s1 = `
			SELECT USER_RID, USER_NAME
			FROM TB_USER
			WHERE USER_ROLE = ? AND KOMPLEK = ?
		`;
		let p1 = [2, req.params.komplekID]
		let r1 = await asyncFB.doQuery(s1, p1)
		res.status(200).json(r1);
	} catch {
		res.status(500).json({message: "Internal Server Error"})
	}
});

module.exports = router;
