const { formatter } = require('@lingui/format-json')

/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ['en'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: './src/locales/{locale}/messages',
      include: ['./src']
    }
  ],
  format: formatter({ style: 'minimal' })
}
