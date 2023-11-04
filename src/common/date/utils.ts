import dayjs from 'dayjs'

import { Locales } from '@/types'

import { DATE_FORMAT } from './constants'

export const localizeDate = (date: Date | number | string, locale: Locales) =>
  Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', weekday: 'long' }).format(dayjs(date).toDate())

export const getDatesArray = (startFrom: string | undefined, step = 1) => {
  const startDate = dayjs(startFrom)

  return new Array(7).fill(0).map((_, i) => startDate.add(i * step, 'days').format(DATE_FORMAT))
}
