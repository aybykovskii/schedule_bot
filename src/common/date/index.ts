import dayjs from 'dayjs'
import { z } from 'zod'

import { Extended } from '@/types/common'
import { Lang } from '@/common/locale'
import { Period } from '@/common/event'


export const DATE_FORMAT = 'MM.DD.YYYY'

const FORMAT_RULES = {
  once: { month: 'long', day: 'numeric', weekday: 'long' },
  weekly: { weekday: 'long' },
} satisfies Record<Period, Intl.DateTimeFormatOptions>

export const localizeDate = (
  { date, locale, period = 'once' }:
  { date: Extended<Date>; locale: Lang; period?: Period },
) =>
  Intl.DateTimeFormat(locale, FORMAT_RULES[period]).format(dayjs(date).toDate())

export const Days = z.enum([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
])

export type Day = z.infer<typeof Days>

  