import { I18n } from 'i18n'
import path from 'path'

import { Locales } from '@/types'

export const i18n = new I18n({
  defaultLocale: Locales.Ru,
  locales: Object.values(Locales),
  directory: path.join(__dirname, 'locales'),
  objectNotation: true,
  missingKeyFn: (locale, key) => {
    const message = `🌏i18next: Missing translation for ${key} in locale: ${locale}`

    console.log(message)

    return message
  },
})

export const { __mf: t } = i18n
