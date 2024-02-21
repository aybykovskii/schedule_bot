import { InlineKeyboardButton } from 'node-telegram-bot-api'
import dayjs from 'dayjs'

import { Event, Period, Periods, Actions } from '@/common/event'
import { t } from '@/common/i18n'
import { env, Day } from '@/common/environment'
import { Dates } from '@/common/date'
import {
  eventActionCD,
  eventDateCD,
  eventPeriodCD,
  eventIdCD,
  eventHourCD,
  localeCD,
  nextDatesCD,
  previousDatesCD,
} from '@/common/callbackData'
import { Lang, Languages } from '@/common/locale'

type Keyboard = InlineKeyboardButton[][]

export class InlineKeyboard {
  #getDates = (
    { from, step = 1, exceptions = [] }:
    { from: string | undefined; step?: number; exceptions?: Day[] },
  ) => {
    const dates: string[] = []
    let current = dayjs(from)

    while (dates.length < 7) {      
      if (!exceptions.includes(Dates.format(current, 'day'))) {
        dates[step > 0 ? 'push' : 'unshift'](Dates.format(current))
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
    period = 'once',
    exceptions = [],
  }: {
    from: string | undefined
    locale: Lang
    cb: (date: string) => string
    step?: number
    exceptions?: Day[]
    period?: Period
  }) => {
    const dates = this.#getDates({ from, step, exceptions })

    return {
      dates,
      keyboard: dates.map((date) => [
        {
          callback_data: cb(date),
          text: `📅 ${Dates.localize({ date, locale, period })}`,
        },
      ]),
    }
  }

  datesWithButtons = ({
    from,
    locale,
    action,
    period,
    exceptions = env.DAY_OFF,
  }: {
    from: string | undefined
    locale: Lang
    action: 'add' | 'subtract'
    exceptions?: Day[]
    period: Period
  }): Keyboard => {
    const { keyboard, dates } = this.dates({
      from,
      locale,
      cb: (date) => eventDateCD.fill({ date }),
      step: action === 'add' ? 1 : -1,
      exceptions,
      period,
    })

    if (period === 'weekly') {
      return keyboard
    }

    const todayDates = this.#getDates({ from: Dates.format(), exceptions })

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

  hours = ({
    exceptions = [],
    from = env.START_HOUR,
    to = env.END_HOUR,
  }: {
    exceptions: number[]
    from?: number
    to?: number
  }): Keyboard => {
    const availableHours: Keyboard = []

    for (let hour = from; hour < to; hour++) {
      if (exceptions.includes(hour)) {
        continue
      } 

      availableHours.push([{
        callback_data: eventHourCD.fill({ hour }),
        text: `🕘 ${hour}:00`,
      }])
    }

    return availableHours
  }

  periods = (locale: Lang): Keyboard =>
    Object.values(Periods.Values).map((period) => [{
      callback_data: eventPeriodCD.fill({ period }),
      text: t({ phrase: `periods.${period}`, locale }),
    }])

  locales = Object.values(Languages.Values).map((locale) => [{
    callback_data: localeCD.fill({ locale }),
    text: t({ phrase: 'locale.name', locale }),
  }])

  events = (
    { events, locale }:
    { events: Event[]; locale: Lang },
  ): Keyboard =>
    events.map(({ _id: id, date, period, hour }) => [
      {
        callback_data: eventIdCD.fill({ id }),
        text: t(
          { phrase: `message.event_short_info_${period}`, locale },
          {
            period: t({ phrase: `periods.${period}`, locale }),
            day: dayjs(date).toDate().toLocaleDateString(locale, { weekday: 'long' }),
            date: Dates.localize({ date, locale }),
            time: `${hour}:00`,
          },
        ),
      },
    ])

  eventActions = (
    { id, locale, period }:
    { id: string; locale: Lang; period: Period },
  ): Keyboard =>
    Object.values(Actions.Values)
      .filter((action) => action !== 'cancel' || period === 'weekly')
      .map((action) => [
        {
          callback_data: eventActionCD.fill({ action, id }),
          text: t({ phrase: `actions.${action}.title`, locale }),
        },
      ])
}

export const inlineKeyboard = new InlineKeyboard()
