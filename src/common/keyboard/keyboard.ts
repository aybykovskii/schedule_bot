import { InlineKeyboardButton } from 'node-telegram-bot-api'
import dayjs from 'dayjs'

import { Actions, Days, Locales, Periods } from '@/types'

import { t } from '../i18n'
import { Event } from '../schemas'
import { env } from '../environment'
import { getPeriodButtonText } from '../event'
import { DATE_FORMAT, localizeDate } from '../date'
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

export class InlineKeyboard {
  #getDates = ({
    from,
    step = 1,
    exceptions = [],
    format = DATE_FORMAT,
  }: {
    from: string | undefined
    step?: number
    exceptions?: string[]
    format?: string
  }) => {
    const dates: string[] = []
    let current = dayjs(from)

    while (dates.length < 7) {
      if (!exceptions.includes(current.format('dddd'))) {
        dates[step > 0 ? 'push' : 'unshift'](current.format(format))
      }

      current = current.add(step, 'days')
    }

    return dates
  }

  dates = ({
    from,
    locale,
    cb,
    step = 1,
    exceptions = [],
  }: {
    from: string | undefined
    locale: Locales
    cb: (date: string) => string
    step?: number
    exceptions?: Days[]
  }) => {
    const dates = this.#getDates({ from, step, exceptions })

    return {
      dates,
      keyboard: dates.map((date) => [
        {
          callback_data: cb(date),
          text: `📅 ${localizeDate(date, locale)}`,
        },
      ]),
    }
  }

  datesWithButtons = ({
    from,
    locale,
    action,
    exceptions = env.WEEKEND.split(',') as Days[],
  }: {
    from: string | undefined
    locale: Locales
    action: 'add' | 'subtract'
    exceptions?: Days[]
  }): Keyboard => {
    const { keyboard, dates } = this.dates({
      from,
      locale,
      cb: (date) => eventCreateDateCD.fill({ date }),
      step: action === 'add' ? 1 : -1,
      exceptions,
    })

    const todayDates = this.#getDates({
      from: dayjs().format(DATE_FORMAT),
      step: 1,
      exceptions,
    })

    const prev = {
      callback_data: previousDatesCD.fill({ date: dates.at(0) }),
      text: '⬅️',
    }

    const next = {
      callback_data: nextDatesCD.fill({ date: dates.at(-1) }),
      text: '➡️',
    }

    return [...keyboard, todayDates.at(0) === dates.at(0) ? [next] : [prev, next]]
  }

  time = ({
    exceptions = [],
    from = +env.START_HOUR,
    to = +env.END_HOUR,
  }: {
    exceptions: number[]
    from?: number
    to?: number
  }): Keyboard => {
    const availableHours: Keyboard = []

    for (let hour = from; hour < to; hour++) {
      if (!exceptions.includes(hour)) {
        availableHours.push([
          {
            callback_data: eventTimeCD.fill({ time: hour }),
            text: `🕘 ${hour}:00`,
          },
        ])
      }
    }

    return availableHours
  }

  periods = ({ locale, periods }: { locale: Locales; periods: Periods[] }): Keyboard =>
    periods.map((period) => [
      {
        callback_data: eventPeriodCD.fill({ period }),
        text: getPeriodButtonText(period, locale),
      },
    ])

  locales = Object.values(Locales).map((locale) => [
    {
      callback_data: localeCD.fill({ locale }),
      text: t({ phrase: 'locale.name', locale }),
    },
  ])

  events = ({ events, locale }: { events: Event[]; locale: Locales }): Keyboard =>
    events.map(({ _id: id, date, period, time }) => [
      {
        callback_data: eventIdCD.fill({ id }),
        text: t(
          { phrase: `message.event_short_info_${period.toLowerCase() as Lowercase<Periods>}`, locale },
          {
            period: getPeriodButtonText(period, locale),
            day: dayjs(date).toDate().toLocaleDateString(locale, { weekday: 'long' }),
            date: localizeDate(date, locale),
            time: `${time}:00`,
          },
        ),
      },
    ])

  eventActions = ({ id, locale }: { id: string; locale: Locales }): Keyboard =>
    Object.values(Actions).map((action) => [
      {
        callback_data: eventActionCD.fill({ action, id }),
        text: t({ phrase: `actions.${action}.title`, locale }),
      },
    ])
}

export const inlineKeyboard = new InlineKeyboard()
