'use strict';

const express = require('express');
const dotenv = require('dotenv').config();
const formidableMiddleware = require('express-formidable');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const qr = require('qrcode');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

app.set('view engine', 'ejs');
app.use(express.json());

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(
	formidableMiddleware({
		uploadDir: './public/uploads/',
		keepExtensions: true,
		multiples: true,
	})
);
const fileStoreOptions = { path: './sessions/' };
app.use(
	session({
		name: 'mallkarbon',
		store: new FileStore(fileStoreOptions),
		secret: process.env.SECRET,
		saveUninitialized: false,
		resave: false,
		cookie: {
			httpOnly: true,
			secure: false,
			maxAge: 1000 * 60 * 60 * 24 * 30,
			sameSite: 'lax'
		},
	})
);

app.use(function (req, res, next) {
	if (req.method === 'GET' && req.query && req.query.source === 'qr') {
		req.session.redirectTo = req.originalUrl.split('?')[0];
		req.session.formData = req.query;
	}

	if(!req.session.login && !req.url.includes('/signin')) {
        res.redirect('/signin');
	} else {
		res.locals = req.session;
		req.session.sessionFlash = req.session.sessionFlash || [];
        req.flash = (type, message) => { req.session.sessionFlash.push({ type, message }); };
        res.locals.flash = req.session.sessionFlash.shift() || '';
		// req.session.sessionFlash = [];
		next();
	}
});

app.use('/', require('./controllers/home'));
app.use('/signin', require('./controllers/signin'));
app.use('/role', require('./controllers/role'));
app.use('/user', require('./controllers/user'));
app.use('/blank', require('./controllers/blank'));
app.use('/sampah', require('./controllers/sampah'));
app.use('/task', require('./controllers/task'));
app.use('/alamat', require('./controllers/alamat'));
app.use('/komplek', require('./controllers/komplek'));

let baseView = {
	title: '',
	errorCode: '',
	errorMessage: '',
	errorDescription: '',
	page: '',
	isfullwidth: 'style="margin-left:0"',
}

app.use((req, res, next) => {
	let redirectTo = '/home-pekerja'; 
			
	if (req.session.login.ROLE_NAME == 'Admin') {
		redirectTo = '/home-admin';
	} else if (req.session.login.ROLE_NAME == 'Pelanggan') {
		redirectTo = '/home-pelanggan';
	}

	let view = { ...baseView, title: 'Page Not Found',
		errorCode: '404',
		errorMessage: 'Page Not Found',
		errorDescription: 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
		page: '404',
		redirect: redirectTo
	}
	res.status(404).render('html', { view });
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	let redirectTo = '/home-pekerja'; 
			
	if (req.session.login.ROLE_NAME == 'Admin') {
		redirectTo = '/home-admin';
	} else if (req.session.login.ROLE_NAME == 'Pelanggan') {
		redirectTo = '/home-pelanggan';
	}

	let view = { ...baseView, title: 'Server Error',
		errorCode: '500',
		errorMessage: 'Server Error',
		errorDescription: 'Something went wrong. Please try again later.',
		page:'404',
		redirect: redirectTo
	}
	res.status(500).render('html', { view });
});

app.listen(port, () => {
  console.log(`Server is running, try access http://localhost:${port} on your browser`);
});
