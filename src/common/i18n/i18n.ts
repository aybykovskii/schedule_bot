import { I18n } from 'i18n'
import path from 'path'

export const i18n = new I18n({
  defaultLocale: 'ru',
  locales: ['ru', 'en'],
  directory: path.join(__dirname, 'locales'),
  missingKeyFn: (locale, key) => {
    const message = `🌏i18next: Missing translation for ${key} in locale: ${locale}`

    console.log(message)

    return message
  },
})
