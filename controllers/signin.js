const express = require('express')
const router = express.Router({ mergeParams: true })
const asyncFB = require('../models/async-firebird')

let view = {
	title: 'Sign In',
	menu: '',
	submenu: '',
	page: 'signin',
	isfullwidth: 'style="margin-left:0"',
}

router.get('/', async function (req, res) {
	res.render('html', { view })
})

router.get('/signout', async function (req, res) {
	req.session.destroy((err) => {
		if (err) {
			console.log(err);
		} else {
			res.redirect('/signin');
		}
	});
})

const bcrypt = require('bcrypt');

router.post('/check', async function (req, res) {
	let s1 = `
		select *
		from tb_user
		inner join tb_role on role_rid=user_role
		where user_username=? and user_password=?
	`
	let p1 = [req.fields.user, req.fields.pass]
	let r1 = await asyncFB.doQuery(s1, p1)

	// Encrypted password

	// let s1 = `
	// 	select *
	// 	from tb_user
	// 	inner join tb_role on role_rid=user_role
	// 	where user_username=?
	// `;
	// let p1 = [req.fields.user];
	// let r1 = await asyncFB.doQuery(s1, p1);

	// if (r1.length === 0) {
	// 	req.flash('error', 'Username or password is incorrect');
	// 	return res.redirect('/login');
	// }

	// const user = r1[0];
	// const isPasswordValid = await bcrypt.compare(req.fields.pass, user.USER_PASSWORD);

	// if (!isPasswordValid) {
	// 	req.flash('error', 'Username or password is incorrect');
	// 	return res.redirect('/login');
	// }
	
	// end
	
	if(r1.length>0) {
		req.session.login = r1[0]
		req.session.login.USER_USERNAME = '',
		req.session.login.USER_PASSWORD = '',
		req.flash('info', `Selamat datang, ${req.session.login.USER_NAME}!`)
		req.session.save((err) => {
            if (err) {
                console.error(err);
                req.flash('error', 'Terjadi kesalahan saat menyimpan sesi.');
                res.redirect('/signin');
                return;
            }
			let redirectTo = '/home-pekerja'; 
			
            if (req.session.login.ROLE_NAME == 'Admin') {
                redirectTo = '/home-admin';
            } else if (req.session.login.ROLE_NAME == 'Pelanggan') {
                redirectTo = '/home';
            }
            if (req.session.redirectTo) {
                redirectTo = req.session.redirectTo;
                delete req.session.redirectTo;
            }

            res.redirect(redirectTo);
        });
	} else {
		req.flash('info', 'User / password akun Anda salah!')
		res.redirect('/signin')
	}
	
})

module.exports = router
