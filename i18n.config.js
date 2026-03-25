const i18n = require('i18n');
const path = require('path');

i18n.configure({
  locales: ['en', 'ar'],                  // supported languages
  defaultLocale: 'en',                     // default language
  directory: path.join(__dirname, 'locales'), // translation files
  cookie: 'language',                      // use the cookie we set
  queryParameter: 'lang',                  // optional: ?lang=ar
  autoReload: true,
  syncFiles: true
});

module.exports = i18n;
