const express = require('express');
const router = express.Router({ mergeParams: true })
const asyncFB = require('../models/async-firebird')

let baseView = {
	title: 'Biodigester',
	menu: '',
	submenu: '',
	page: 'biodigester',
	url: 'biodigester',
	isfullwidth: null,
	back: '',
}

let vdata = {
    table : 'TB_KOMPLEK',
    columns_name : ['ID', 'Komplek', 'Kecamatan', 'Kelurahan', 'Kota', 'Provinsi'],
    columns : ['KOMPLEK_RID', 'NAMA_KOMPLEK', 'KECAMATAN', 'KELURAHAN', 'KOTA', 'PROVINSI'],
    types : ['id', 'text', 'text', 'text', 'text', 'text'],
    values : ['', '', '', '', '', ''],
    isreqs : ['required', 'required', 'required', 'required', 'required', 'required'],
}

router.get('/', async function (req, res) {
    const view = { ...baseView, title:'Data Komplek', page: 'komplek', back: '/home-admin' };
    const s1 =`
        SELECT * FROM ${vdata.table}
    `
    let data = await asyncFB.doQuery(s1)

    res.render('html', { view, data });
});

router.get('/create', async function (req, res) {
    const view = { ...baseView, title:'Tambah Data Komplek', page: 'create-komplek', back: '/komplek' };

    res.render('html', { view });
});

router.post('/create', async function (req, res) {
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

			rs = await asyncFB.doQuery(`insert into ${vdata.table} ( ${kolom} ) values ( ${nilai} )`, []);
			req.flash(`success`, `Data komplek berhasil ditambahkan`);
		} catch (err) {
			console.log(err);
			req.flash(`error`, `Gagal menambahkan data<br><br><small>${err.stack.split(' at')[0]}</small>`);
		} finally {
			req.session.save((err) => {
                if (err) {
                    console.error(err);
                }
                res.redirect(`/${baseView.url}`);
            });
		}
	}
});

router.get('/jumlah-komplek', async function (req, res) {
	let s1 = `select COUNT(KOMPLEK_RID) as JUMLAH from ${vdata.table}`
	let r1 = await asyncFB.doQuery(s1)
	res.json(r1[0]);
});

module.exports = router;