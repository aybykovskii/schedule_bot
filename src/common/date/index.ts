import dayjs from 'dayjs'

import { Extended } from '@/types/common'
import { Lang } from '@/common/locale'
import { Period } from '@/common/event'

import { Day } from '../environment'

export class Dates {
  static formats = {
    date: 'MM.DD.YYYY',
    day: 'dddd',
  }

  private static rules: Record<Period, Intl.DateTimeFormatOptions> = {
    once: { month: 'long', day: 'numeric', weekday: 'long' },
    weekly: { weekday: 'long' },
  }

  static localize = (
    { date, locale, period = 'once' }:
    { date: Extended<Date>; locale: Lang; period?: Period },
  ) =>
    Intl.DateTimeFormat(locale, this.rules[period]).format(dayjs(date).toDate())

  static format = <F extends keyof typeof Dates.formats>(
    date?: dayjs.Dayjs, format?: F): F extends 'day' ? Day : string => (
    (date || dayjs()).format(this.formats[format ?? 'date']) as F extends 'day' ? Day : string
  )
}
