const express = require('express');
const router = express.Router({ mergeParams: true })
const asyncFB = require('../models/async-firebird')

let baseView = {
	title: 'Input Data Sampah',
	menu: '',
	submenu: '',
	page: 'sampah',
	url: 'sampah',
	isfullwidth: null,
}

let vdata = {
    table : 'TB_SAMPAH',
    columns_name : ['ID', 'Berat', 'Komplek', 'Lokasi', 'Nama Penyumbang', 'Waktu'],
    columns : ['SAMPAH_RID', 'BERAT_SAMPAH', 'KOMPLEK_PENYUMBANG', 'ALAMAT_PENYUMBANG', 'PENYUMBANG', 'WAKTU'],
    types : ['id', 'text', 'select', 'text', 'select', 'date'],
    values : ['', '', '', '', '', ''],
    isreqs : ['required', 'required', 'required', 'required', 'required', 'required'],
}


router.get('/', async function (req, res) {
	let view = {};
	let data = {};
	if (req.session.login.ROLE_NAME == "Pelanggan") {
		view = { ...baseView, title:'Riwayat Data Sampah', page: 'sampah-pengguna' };
		let s1 = `select s.SAMPAH_RID, s.WAKTU, s.BERAT_SAMPAH, k.NAMA_KOMPLEK, a.jalan, a.kecamatan, a.kelurahan, a.kota, a.provinsi, a.kode_pos, u.USER_NAME
		from TB_SAMPAH s INNER JOIN TB_KOMPLEK k on s.KOMPLEK_PENYUMBANG = k.KOMPLEK_RID INNER JOIN TB_ALAMAT a on s.ALAMAT_PENYUMBANG = a.ALAMAT_RID
		INNER JOIN TB_USER u on s.PEKERJA = u.USER_RID where PENYUMBANG=? order by s.waktu desc`
		let p1 = [req.session.login.USER_RID]
		data = await asyncFB.doQuery(s1, p1)
	} else {
		view = { ...baseView, title:'Riwayat Data Sampah', page: 'sampah' };
		let s1 = `select s.SAMPAH_RID, s.WAKTU, s.BERAT_SAMPAH, k.NAMA_KOMPLEK, a.jalan, a.kecamatan, a.kelurahan, a.kota, a.provinsi, a.kode_pos, u.USER_NAME
		from TB_SAMPAH s INNER JOIN TB_KOMPLEK k on s.KOMPLEK_PENYUMBANG = k.KOMPLEK_RID INNER JOIN TB_ALAMAT a on s.ALAMAT_PENYUMBANG = a.ALAMAT_RID
		INNER JOIN TB_USER u on s.PENYUMBANG = u.USER_RID where pekerja=? order by s.waktu desc`
		let p1 = [req.session.login.USER_RID]
		data = await asyncFB.doQuery(s1, p1)
		
	}
	const adjustedResults = data.map(row => {
		const dateCreated = new Date(row.WAKTU);
		dateCreated.setHours(dateCreated.getHours() + 7);
		const day = dateCreated.getUTCDate();
		const month = dateCreated.toLocaleString('id-ID', { month: 'short', timeZone: 'UTC' });
		row.WAKTU = `${day} ${month}`;
		return row;
	});

	res.render('html', { view, adjustedResults });
});

router.get('/create', async function (req, res) {
	const view = { ...baseView, page: 'create-sampah' };

	if (req.session.formData) {
        const formData = req.session.formData;
        delete req.session.formData;
        res.render('html', { view, formData });
    } else {
        res.render('html');
    }
});

function getCurrentDateTimeGMT7() {
    const now = new Date();
    const gmt7Offset = 7 * 60 * 60 * 1000;
    const gmt7Date = new Date(now.getTime() + gmt7Offset);
    
    const year = gmt7Date.getUTCFullYear();
    const month = String(gmt7Date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(gmt7Date.getUTCDate()).padStart(2, '0');
    const hours = String(gmt7Date.getUTCHours()).padStart(2, '0');
    const minutes = String(gmt7Date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(gmt7Date.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

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
			console.log(new Date())
			kolom = kolom + ',' + 'pekerja' + ',' + 'waktu';
			nilai = nilai + ',' + req.session.login.USER_RID + ',' +  `'${getCurrentDateTimeGMT7()}'`;

			rs = await asyncFB.doQuery(`insert into ${vdata.table} ( ${kolom} ) values ( ${nilai} )`, []);
			req.flash(`success`, `Data sampah berhasil ditambahkan`);
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

const getWeekRange = () => {
    const today = new Date();
	const gmt7Offset = 7 * 60 * 60 * 1000;
	const gmt7Date = new Date(today.getTime() + gmt7Offset);
    const dayOfWeek = gmt7Date.getUTCDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 5);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
        startOfWeek: startOfWeek.toISOString().split('T')[0], 
        endOfWeek: endOfWeek.toISOString().split('T')[0]
    };
};

const getMonthRange = () => {
    const today = new Date();
    const gmt7Offset = 7 * 60 * 60 * 1000;

    const gmt7Date = new Date(today.getTime() + gmt7Offset);

    const startOfMonth = new Date(gmt7Date.getUTCFullYear(), gmt7Date.getUTCMonth(), 3);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const endOfMonth = new Date(gmt7Date.getUTCFullYear(), gmt7Date.getUTCMonth() + 1, 1);
    endOfMonth.setUTCHours(23, 59, 59, 999);

    const startOfMonthLocal = new Date(startOfMonth.getTime() - gmt7Offset);
    const endOfMonthLocal = new Date(endOfMonth.getTime() - gmt7Offset);

    return {
        startOfMonth: startOfMonthLocal.toISOString().split('T')[0],
        endOfMonth: endOfMonthLocal.toISOString().split('T')[0]
    };
};

const getTodayRangeInGMT7 = () => {
    const today = new Date();
    const gmt7Offset = 7 * 60 * 60 * 1000;

    const gmt7Date = new Date(today.getTime() + gmt7Offset);

    const startOfDay = new Date(gmt7Date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(gmt7Date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const startOfDayLocal = new Date(startOfDay.getTime());
    const endOfDayLocal = new Date(endOfDay.getTime());

    return {
        startOfDay: startOfDayLocal.toISOString().split('.')[0].replace('T', ' '),
        endOfDay: endOfDayLocal.toISOString().split('.')[0].replace('T', ' ')
    };
};


router.get('/data-user-per-hari', async function (req, res) {
	const { startOfDay, endOfDay } = getTodayRangeInGMT7();
	try {
		let s1 = `
			SELECT COUNT(DISTINCT PENYUMBANG) AS SUDAH
			FROM TB_SAMPAH
			WHERE WAKTU >= ? AND WAKTU <= ?
		`;
		let p1 = [startOfDay, endOfDay]
		let r1 = await asyncFB.doQuery(s1, p1)
		let s2 = `
			SELECT COUNT(USER_RID) AS TOTAL
			FROM TB_USER
			WHERE USER_ROLE = ?
		`;
		let p2 = [3];
		let r2 = await asyncFB.doQuery(s2, p2);
		let result = {
			belum: r2[0].TOTAL - r1[0].SUDAH,
			sudah: r1[0].SUDAH
		}
		res.status(200).json(result);
	} catch {
		res.status(500).json({message: "Internal Server Error"})
	}
});

router.get('/data-petugas-per-bulan', async function (req, res) {
	const { startOfMonth, endOfMonth } = getMonthRange();
	try {
		let s1 = `
			SELECT SUM(BERAT_SAMPAH) as BERAT
			FROM TB_SAMPAH
			WHERE WAKTU >= ? AND WAKTU <= ? AND PEKERJA = ?
		`;
		let p1 = [startOfMonth, endOfMonth, req.session.login.USER_RID]
		let r1 = await asyncFB.doQuery(s1, p1)

		res.status(200).json(r1[0]);
	} catch {
		res.status(500).json({message: "Internal Server Error"})
	}
});

router.get('/data-pelanggan-per-bulan', async function (req, res) {
	const { startOfMonth, endOfMonth } = getMonthRange();
	try {
		let s1 = `
			SELECT SUM(BERAT_SAMPAH) as BERAT
			FROM TB_SAMPAH
			WHERE WAKTU >= ? AND WAKTU <= ? AND PENYUMBANG = ?
		`;
		let p1 = [startOfMonth, endOfMonth, req.session.login.USER_RID]
		let r1 = await asyncFB.doQuery(s1, p1)

		res.status(200).json(r1[0]);
	} catch {
		res.status(500).json({message: "Internal Server Error"})
	}
});

router.get('/data-pelanggan-per-minggu', async function (req, res) {
	const { startOfWeek, endOfWeek } = getWeekRange();
	try {
		let s1 = `
			SELECT SUM(BERAT_SAMPAH) as BERAT
			FROM TB_SAMPAH
			WHERE WAKTU >= ? AND WAKTU <= ? AND PENYUMBANG = ?
		`;
		let p1 = [startOfWeek, endOfWeek, req.session.login.USER_RID]
		let r1 = await asyncFB.doQuery(s1, p1)

		res.status(200).json(r1[0]);
	} catch {
		res.status(500).json({message: "Internal Server Error"})
	}
});

router.get('/data-user-hari-ini', async function (req, res) {
	const { startOfDay, endOfDay } = getTodayRangeInGMT7();
	try {
		let s1 = `
			SELECT s.BERAT_SAMPAH, u.USER_NAME
			FROM TB_SAMPAH s JOIN TB_USER u ON s.PEKERJA = u.USER_RID
			WHERE WAKTU >= ? AND WAKTU <= ? AND PENYUMBANG = ?
		`;
		let p1 = [startOfDay, endOfDay, req.session.login.USER_RID]
		let r1 = await asyncFB.doQuery(s1, p1)
		if (r1.length == 0) {
			res.status(200).json(r1);
		} else {
			res.status(200).json(r1[0]);
		}
	} catch {
		res.status(500).json({message: "Internal Server Error"})
	}
});

router.get('/total-sampah-user', async function (req, res) {
	try {
		let s1 = `
			SELECT SUM(BERAT_SAMPAH) as TOTAL
			FROM TB_SAMPAH
			WHERE PENYUMBANG = ?
		`;
		let p1 = [req.session.login.USER_RID]
		let r1 = await asyncFB.doQuery(s1, p1)
		res.status(200).json(r1[0]);
	} catch {
		res.status(500).json({message: "Internal Server Error"})
	}
});

router.get('/kontribusi-user-per-minggu', async function (req, res) {
	const { startOfWeek, endOfWeek } = getWeekRange();
	try {
		let s1 = `
			SELECT SUM(BERAT_SAMPAH) as BERAT
			FROM TB_SAMPAH
			WHERE WAKTU >= ? AND WAKTU <= ? AND PENYUMBANG = ?
		`;
		let p1 = [startOfWeek, endOfWeek, req.session.login.USER_RID];
		let r1 = await asyncFB.doQuery(s1, p1);
		let s2 = `
			SELECT SUM(BERAT_SAMPAH) as TOTAL_BERAT
			FROM TB_SAMPAH
			WHERE KOMPLEK_PENYUMBANG = ?
		`;
		let p2 = [req.session.login.KOMPLEK];
		let r2 = await asyncFB.doQuery(s2, p2);

		const data = {
			SAMPAH_USER: r1[0].BERAT,
			TOTAL_SAMPAH: r2[0].TOTAL_BERAT
		}
		res.status(200).json(data);
	} catch {
		res.status(500).json({message: "Internal Server Error"})
	}
});
module.exports = router;
