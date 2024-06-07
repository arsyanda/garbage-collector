const express = require('express');
const router = express.Router({ mergeParams: true })
const asyncFB = require('../models/async-firebird')
const QRCode = require('qrcode');

let baseView = {
	title: 'Alamat',
	menu: '',
	submenu: '',
	page: 'alamat',
	url: 'alamat',
	isfullwidth: null,
}

let vdata = {
    table : 'TB_ALAMAT',
    columns_name : ['ID', 'Jalan', 'Kecamatan', 'Kelurahan', 'Kota', 'Provinsi', 'Kode Pos'],
    columns : ['ALAMAT_RID', 'JALAN', 'KECAMATAN', 'KELURAHAN', 'KOTA', 'PROVINSI', 'KODE_POS'],
    types : ['id', 'text', 'text', 'text', 'text', 'text', 'text'],
    values : ['', '', '', '', '', ''],
    isreqs : ['required', 'required', 'required', 'required', 'required', 'required'],
}

router.get('/semua-alamat/:komplekID', async function (req, res) {
	let s1 = `select * from ${vdata.table} where komplek=?`
	let p1 = [req.params.komplekID]
	let r1 = await asyncFB.doQuery(s1, p1)
	res.json(r1);
});

router.get('/generate-qr/:alamatID', async function (req, res) {
	let s1 = `select k.komplek_rid, k.nama_komplek, u.user_rid, u.user_name,
	a.alamat_rid, a.jalan, a.kecamatan, a.kelurahan, a.kota, a.provinsi, a.kode_pos
	from ${vdata.table} a JOIN TB_KOMPLEK k ON a.komplek = k.komplek_rid
	JOIN TB_USER u ON u.alamat = a.alamat_RID where alamat_rid=?`
	let p1 = [req.params.alamatID]
	let r1 = await asyncFB.doQuery(s1, p1)
	let formData = r1[0]
	var alamat = `${formData.JALAN}, ${formData.KECAMATAN}, ${formData.KELURAHAN}, ${formData.KOTA}, ${formData.PROVINSI}, ${formData.KODE_POS}`
	delete formData.JALAN;
	delete formData.KECAMATAN;
	delete formData.KELURAHAN;
	delete formData.KOTA;
	delete formData.PROVINSI;
	delete formData.KODE_POS;
	formData.ALAMAT = alamat
	const queryString = new URLSearchParams(formData).toString();
	const url = `${req.protocol}://192.168.1.14:3001/sampah/create?source=qr&${queryString}`;
	console.log(url)
	try {
        const qrCodeData = await QRCode.toDataURL(url);
        res.send(`<img src="${qrCodeData}" alt="QR Code">`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating QR code');
    }
})
module.exports = router;