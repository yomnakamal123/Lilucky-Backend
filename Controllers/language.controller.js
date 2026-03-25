const asyncwrapper = require('../asyncwrapper');

const setLanguage = asyncwrapper(async (req, res, next) => {
  const { language } = req.body;
  const allowedLanguages = ['en', 'ar'];

  if (!allowedLanguages.includes(language)) {
    return res.status(400).json({ status: 'error', message: 'Invalid language' });
  }

  res.cookie('language', language, {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    httpOnly: true
  });

  req.setLocale(language); // set language for this request

  res.status(200).json({ status: 'success', message: res.__('languageChanged') });
});

module.exports = { setLanguage };
