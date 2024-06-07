const express = require('express');
const router = express.Router({ mergeParams: true })
const asyncFB = require('../models/async-firebird')

let baseView = {
	title: 'Task',
	menu: '',
	submenu: '',
	page: 'task',
	url: 'task',
	isfullwidth: null,
}

let vdata = {
    table : 'TB_TASK',
    columns_name : ['ID', 'Pekerja', 'Deadline', 'Status', 'Komplek', 'Alamat'],
    columns : ['TASK_RID', 'TASK_WORKER', 'TASK_DEADLINE', 'TASK_STATUS', 'KOMPLEK', 'ALAMAT'],
}

router.get('/create', async function (req, res) {
	const view = { ...baseView,title:'Input Data Task', page: 'create-task' };

	let s1 = `select * from TB_KOMPLEK`
	let p1 = [req.fields.user, req.fields.pass]
	let komplek = await asyncFB.doQuery(s1, p1)
	res.render('html', { view, komplek })
});

router.post('/create', async function (req, res) {
	if (!req.session.login) {
		res.redirect('/login/logout');
	} else {
		try {
			req.fields.task_deadline = req.fields.task_deadline + " 23:59:59";
			kolom = Object.keys(req.fields).join(', ');
			nilai = `'` + Object.values(req.fields).join(`', '`) + `'`;
			kolom1 = Object.keys(req.files).join(', ');
			docs = [];
			for (const property in req.files) {
				if (String(req.files[property].path.split('uploads/')[1]).includes('.')) {
					let data = req.files[property].path.split('uploads/')[1];
					docs.push(data);
				} else {
					let data = '';
					docs.push(data);
				}
			}
			nilai1 = `'` + docs.join(`', '`) + `'`;
			if (kolom1 && nilai1) {
				kolom = kolom + ',' + kolom1;
				nilai = nilai + ',' + nilai1;
			}
            kolom = kolom + ',' + ' task_status';
			nilai = nilai + ',' + ` 'On Progress'`;

			rs = await asyncFB.doQuery(`insert into ${vdata.table} ( ${kolom} ) values ( ${nilai} )`, []);
			req.flash(`success`, `Data task berhasil ditambahkan`);
		} catch (err) {
			req.flash(`error`, `Gagal menambahkan data<br><br><small>${err.stack.split(' at')[0]}</small>`);
		} finally {
			req.session.save((err) => {
                if (err) {
                    console.error(err);
                }
                res.redirect(`/home-admin`);
            });
		}
	}
});

router.get('/get-all-task', async function (req, res) {
	let s1 = `select t.TASK_RID, t.TASK_DEADLINE, t.TASK_STATUS, k.NAMA_KOMPLEK,
	a.JALAN, a.KECAMATAN, a.KELURAHAN, a.KOTA, a.PROVINSI, a.KODE_POS,
	u.USER_NAME
	from ${vdata.table} t JOIN TB_ALAMAT a
	ON t.ALAMAT = a.ALAMAT_RID JOIN TB_KOMPLEK k ON
	t.KOMPLEK = k.KOMPLEK_RID JOIN TB_USER u ON
	t.TASK_WORKER = u.USER_RID
	`
	let r1 = await asyncFB.doQuery(s1)
	res.json(r1);
});

router.get('/get-worker-task', async function (req, res) {
	let s1 = `select t.TASK_RID, t.TASK_DEADLINE, t.TASK_STATUS, k.NAMA_KOMPLEK,
	a.JALAN, a.KECAMATAN, a.KELURAHAN, a.KOTA, a.PROVINSI, a.KODE_POS
	from ${vdata.table} t JOIN TB_ALAMAT a
	ON t.ALAMAT = a.ALAMAT_RID JOIN TB_KOMPLEK k ON
	t.KOMPLEK = k.KOMPLEK_RID WHERE TASK_WORKER = ?
	`
	let p1 = [req.session.login.USER_RID]
	let r1 = await asyncFB.doQuery(s1,p1)
	res.json(r1);
});

router.delete('/delete/:taskID', async function (req, res) {
	try {
		let s1 = `DELETE FROM ${vdata.table} WHERE TASK_RID = ?
		`
		let p1 = [req.params.taskID]
		let r1 = await asyncFB.doQuery(s1,p1)
		req.flash(`success`, `Data task berhasil dihapus`);
		res.status(200).json({message: "Task berhasil dihapus"})
	} catch {
		req.flash(`error`, `Gagal menghapus data<br><br><small>${err.stack.split(' at')[0]}</small>`);
		res.status(500).json({message: "Internal Server Error"})
	}
});

module.exports = router;