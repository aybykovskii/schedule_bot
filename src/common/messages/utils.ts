import { InlineKeyboardButton } from 'node-telegram-bot-api'

import { LessonPeriod } from '@/types'

import { formatDate } from '../date'
import { env } from '../environment'
import { getButtonTextByPeriod } from '../lesson'

export const getDatesInlineKeyboard = () => {
  const today = new Date().getDate() + 1
  const month = new Date().getMonth() + 1
  const year = new Date().getFullYear()

  const dates: InlineKeyboardButton[][] = new Array(7)
    .fill(0)
    .map((_, i) => today + i)
    .map((day) => [
      {
        callback_data: `${month}.${day}.${year}`,
        text: `📅 ${formatDate(`${month}.${day}.${year}`)}`,
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
      callback_data: `${hour}:00`,
      text: `🕘 ${hour}:00`,
    },
  ])

  return hours
}

export const getPeriodsInlineKeyboard = () => {
  const periods: InlineKeyboardButton[][] = Object.values(LessonPeriod).map((period) => [
    {
      callback_data: period,
      text: getButtonTextByPeriod(period),
    },
  ])

  return periods
}
