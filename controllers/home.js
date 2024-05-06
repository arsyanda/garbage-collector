const express = require('express');
const router = express.Router({ mergeParams: true });
const asyncFB = require('../models/async-firebird');

module.exports = router;   