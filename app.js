'use strict';

const express = require('express');
const dotenv = require('dotenv').config();
const formidableMiddleware = require('express-formidable');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const app = express();
const port = 3001;

app.set('view engine', 'ejs');
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
		},
	})
);

app.use(function (req, res, next) {
	if(!req.session.login && !req.url.includes('/signin')) {
		res.redirect('/signin')
	} else {
		res.locals = req.session;
		req.session.sessionFlash = req.session.sessionFlash || [];
		req.flash = (type, message) => { req.session.sessionFlash.push({ type, message }); };
		res.locals.flash = req.session.sessionFlash[0] || '';
		req.session.sessionFlash = [];
		
		next();
	}
});

app.use('/', require('./controllers/signin'));
app.use('/signin', require('./controllers/signin'));
app.use('/role', require('./controllers/role'));
app.use('/user', require('./controllers/user'));
app.use('/blank', require('./controllers/blank'));
app.use('/bank-sampah', require('./controllers/bank-sampah'));


app.listen(port, () => {
  console.log(`Server is running, try access http://localhost:${port} on your browser`);
});
