import { I18n } from 'i18n'
import path from 'path'

import { Locales, Paths } from '@/types'

import { Log } from '../logger'

import ruLocale from './locales/ru.json'

type Locale = typeof ruLocale

export const i18n = new I18n({
  defaultLocale: Locales.Ru,
  locales: Object.values(Locales),
  directory: path.join(__dirname, 'locales'),
  objectNotation: true,
  missingKeyFn: (locale, key) => {
    const message = `🌏i18next: Missing translation for ${key} in locale: ${locale}`

    Log.warn(message)

    return message
  },
})

export const { __mf } = i18n
export type Phrase = Paths<Locale>

export const t = (phrase: { phrase: Phrase; locale: Locales }, replace?: Record<string, unknown>) =>
  __mf(phrase, replace)
