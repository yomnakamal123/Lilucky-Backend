const express = require('express');
const router = express.Router();
const { setLanguage } = require('../Controllers/language.controller');

router.post('/language', setLanguage);

module.exports = router;
