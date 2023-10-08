import { DeepPartial, Periods, Locales } from '@/types'

import { t } from '../i18n'
import { Event, EventSchema } from '../schemas'

export const getPeriodButtonText = (period: Periods, locale: Locales) => {
  switch (period) {
    case Periods.Once:
      return t({ phrase: 'periods.once', locale })

    case Periods.Weekly:
      return t({ phrase: 'periods.weekly', locale })

    default:
      period satisfies never

      return ''
  }
}

export const isEventFilled = (event: DeepPartial<Event>) =>
  EventSchema.omit({ googleEventId: true }).safeParse(event).success

export function assertIsEventFilled(event: Partial<Event>): asserts event is Required<Event> {
  if (!event.isFilled) {
    throw Error(`Event ${event._id} is unfilled`)
  }
}
