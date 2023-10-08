import { InlineKeyboardButton } from 'node-telegram-bot-api'
import dayjs from 'dayjs'

import { Actions, Locales, Periods } from '@/types'

import { t } from '../i18n'
import { Event } from '../schemas'
import { env } from '../environment'
import { getPeriodButtonText } from '../event'
import { DATE_FORMAT, getDatesArray, localizeDate } from '../date'
import {
  eventActionCD,
  eventCreateDateCD,
  eventPeriodCD,
  eventIdCD,
  eventTimeCD,
  localeCD,
  nextDatesCD,
  previousDatesCD,
} from '../callbackData'

type Keyboard = InlineKeyboardButton[][]

export const getDatesKeyboard = (
  startFrom: string | undefined,
  locale: Locales,
  cb: (date: string) => string,
  step = 1
) => {
  const dates = getDatesArray(startFrom, step)

  const buttons: Keyboard = dates.map((date) => [
    {
      callback_data: cb(date),
      text: `📅 ${localizeDate(date, locale)}`,
    },
  ])

  return buttons
}

export const getCreateEventDatesInlineKeyboard = (startFrom: string | undefined, locale: Locales) => {
  const isSameDates = dayjs(startFrom).format(DATE_FORMAT) === dayjs().format(DATE_FORMAT)
  const dates = getDatesArray(startFrom)
  const [firstDate] = dates

  const datesButtons = getDatesKeyboard(startFrom, locale, (date) => eventCreateDateCD.fill({ date }))

  const prev = {
    callback_data: previousDatesCD.fill({ date: firstDate }),
    text: '⬅️',
  }

  const next = {
    callback_data: nextDatesCD.fill({ date: firstDate }),
    text: '➡️',
  }

  return datesButtons.concat(isSameDates ? [[next]] : [[prev, next]])
}

export const getTimeInlineKeyboard = (busyHours: number[]) => {
  const availableHours = new Array(+env.END_HOUR - +env.START_HOUR)
    .fill(0)
    .map((_, i) => +env.START_HOUR + i)
    .filter((hour) => !busyHours.includes(hour))

  const hours: Keyboard = availableHours.map((hour) => [
    {
      callback_data: eventTimeCD.fill({ time: hour }),
      text: `🕘 ${hour}:00`,
    },
  ])

  return hours
}

export const getPeriodsInlineKeyboard = (locale: Locales) => {
  const periods: Keyboard = Object.values(Periods).map((period) => [
    {
      callback_data: eventPeriodCD.fill({ period }),
      text: getPeriodButtonText(period, locale),
    },
  ])

  return periods
}

export const getLocalesInlineKeyboard = () => {
  const locales: Keyboard = Object.values(Locales).map((locale) => [
    {
      callback_data: localeCD.fill({ locale }),
      text: t({ phrase: 'locale.name', locale }),
    },
  ])

  return locales
}

export const getEventsInlineKeyboard = (events: Event[], locale: Locales) => {
  const eventButtons: Keyboard = events.map(({ _id: id, date, period, time }) => [
    {
      callback_data: eventIdCD.fill({ id }),
      text: t(
        { phrase: `message.event_short_info_${period.toLowerCase() as Lowercase<Periods>}`, locale },
        {
          period: getPeriodButtonText(period, locale),
          day: dayjs(date).toDate().toLocaleDateString(locale, { weekday: 'long' }),
          date: localizeDate(date, locale),
          time: `${time}:00`,
        }
      ),
    },
  ])

  return eventButtons
}

export const getEventActionsInlineKeyboard = (eventId: string, locale: Locales) => {
  const actionsButtons: Keyboard = Object.values(Actions).map((action) => [
    {
      callback_data: eventActionCD.fill({ action, id: eventId }),
      text: t({ phrase: `actions.${action}.title`, locale }),
    },
  ])

  return actionsButtons
}
