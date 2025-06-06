const i18n = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');

i18n
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en', 
    preload: ['en', 'uk'], 
    backend: {
      loadPath: './locales/{{lng}}/translation.json', // Шлях до файлів перекладу
    },
    detection: {
      order: ['querystring', 'header'], // Визначення мови через параметри запиту або заголовки
      lookupQuerystring: 'lng',
      lookupHeader: 'accept-language',
    },
  });

module.exports = {
  i18n,
  middleware, 
};