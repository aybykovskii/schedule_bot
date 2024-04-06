import dayjs, { Dayjs } from 'dayjs'
import { InlineKeyboardButton } from 'node-telegram-bot-api'

import {
  eventActionCD,
  eventHourCD,
  eventIdCD,
  eventPeriodCD,
  localeCD,
  changeDatesCD,
} from '@/common/callbackData'
import { Dates } from '@/common/date'
import { Day, env } from '@/common/environment'
import { Actions, Event, Period, Periods } from '@/common/event'
import { t } from '@/common/i18n'
import { Lang, Languages } from '@/common/locale'

type Keyboard = InlineKeyboardButton[][]

type DatesBaseArgs = {
  start: Dayjs
  step?: number
  exceptions?: Day[]
}

export type DatesArgs = DatesBaseArgs & {
  locale: Lang
  cb: (date: string) => string
  period?: Period
  withControls?: boolean
}

export class InlineKeyboard {
  #getAvailableDates = ({ start, step = 1, exceptions = [] }: DatesBaseArgs) => {
    const dates: string[] = []
    let current = start

    for (let i = 0; i < 7; i++) {
      if (!exceptions.includes(Dates.format(current, 'day'))) {
        dates.push(Dates.format(current))
      }

      current = current.add(step, 'days')
    }

    return dates
  }

  dates = ({ locale, cb, period, withControls, ...datesArg }: DatesArgs) => {
    const dates = this.#getAvailableDates(datesArg)

    const keyboard = dates.map((date) => [
      {
        callback_data: cb(date),
        text: `📅 ${Dates.localize({ date, locale, period })}`,
      },
    ])

    if (!withControls) {
      return keyboard
    }

    const { start } = datesArg
    const previousDatesFrom = Dates.format(dayjs(start).subtract(7, 'days'))
    const nextDatesFrom = Dates.format(dayjs(start).add(7, 'days'))

    const prev = {
      callback_data: changeDatesCD.fill({ date: previousDatesFrom }),
      text: '⬅️',
    }

    const next = {
      callback_data: changeDatesCD.fill({ date: nextDatesFrom }),
      text: '➡️',
    }

    return [...keyboard, dayjs().isSame(dayjs(start), 'date') ? [next] : [prev, next]]
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

      availableHours.push([
        {
          callback_data: eventHourCD.fill({ hour }),
          text: `🕘 ${hour}:00`,
        },
      ])
    }

    return availableHours
  }

  periods = (locale: Lang): Keyboard =>
    Object.values(Periods.Values).map((period) => [
      {
        callback_data: eventPeriodCD.fill({ period }),
        text: t({ phrase: `periods.${period}`, locale }),
      },
    ])

  locales = Object.values(Languages.Values).map((locale) => [
    {
      callback_data: localeCD.fill({ locale }),
      text: t({ phrase: 'locale.name', locale }),
    },
  ])

  events = ({ events, locale }: { events: Event[]; locale: Lang }): Keyboard =>
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
          }
        ),
      },
    ])

  eventActions = ({ id, locale, period }: { id: string; locale: Lang; period: Period }): Keyboard =>
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
