import dayjs from 'dayjs'

import { Locales } from '@/types'

export const localizeDate = (date: Date | number | string, locale: Locales) =>
  Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', weekday: 'long' }).format(dayjs(date).toDate())
