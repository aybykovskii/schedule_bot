import { InlineKeyboardButton } from 'node-telegram-bot-api'

import { Locales, LessonPeriod } from '@/types'

import { t } from '../i18n'
import { formatDate } from '../date'
import { env } from '../environment'
import { getButtonTextByPeriod } from '../lesson'

export const getDatesInlineKeyboard = (locale: Locales) => {
  const today = new Date().getDate() + 1
  const month = new Date().getMonth() + 1
  const year = new Date().getFullYear()

  const dates: InlineKeyboardButton[][] = new Array(7)
    .fill(0)
    .map((_, i) => today + i)
    .map((day) => [
      {
        callback_data: `${month}.${day}.${year}`,
        text: `📅 ${formatDate(`${month}.${day}.${year}`, locale)}`,
      },
    ])

  return dates
}

export const getTimeInlineKeyboard = (busyHours: number[]) => {
  const availableHours = new Array(+env.END_HOUR - +env.START_HOUR)
    .fill(0)
    .map((_, i) => +env.START_HOUR + i)
    .filter((hour) => !busyHours.includes(hour))

  const hours: InlineKeyboardButton[][] = availableHours.map((hour) => [
    {
      callback_data: `${hour}`,
      text: `🕘 ${hour}:00`,
    },
  ])

  return hours
}

export const getPeriodsInlineKeyboard = (locale: Locales) => {
  const periods: InlineKeyboardButton[][] = Object.values(LessonPeriod).map((period) => [
    {
      callback_data: period,
      text: getButtonTextByPeriod(period, locale),
    },
  ])

  return periods
}

export const getLocalesInlineKeyboard = () => {
  const locales: InlineKeyboardButton[][] = Object.values(Locales).map((locale) => [
    {
      callback_data: locale,
      text: t({ phrase: 'title', locale }),
    },
  ])

  return locales
}
