import * as ics from 'ics'

import { Lesson } from '@/common/lesson'
import { getIcsDate } from '@/common/date'
import { LessonPeriod } from '@/types'

class GoogleCalendar {
  asIcs = (lessons: Lesson[]) => {
    const { value, error } = ics.createEvents(
      lessons.map(({ name, tg, date, time, period }) => ({
        title: `${name} - ${tg}`,
        start: getIcsDate(date, time),
        startInputType: 'utc',
        startOutputType: 'utc',
        end: getIcsDate(date, time + 1),
        endInputType: 'utc',
        endOutputType: 'utc',
        recurrenceRule: period === LessonPeriod.Weekly ? `FREQ=${period.toUpperCase()}` : '',
        busyStatus: 'FREE',
        transp: 'OPAQUE',
      }))
    )

    if (error) return ''

    return value
  }
}
export const googleCalendar = new GoogleCalendar()
