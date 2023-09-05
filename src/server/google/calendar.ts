import * as ics from 'ics'

import { Lesson } from '@/common/lesson'
import { GOOGLE_FREQ_BY_PERIOD, getIcsDate } from '@/common/date'

class GoogleCalendar {
  asIcs = (lessons: Lesson[]) => {
    const now = new Date()
    const today = now.toLocaleDateString('ru')
    const hour = now.getHours()

    const { value, error } = ics.createEvents(
      lessons.map(({ name, tg, date, time, period }) => ({
        title: `${name} - ${tg}`,
        start: getIcsDate(date, time),
        startInputType: 'utc',
        startOutputType: 'utc',
        end: getIcsDate(date, time + 1),
        endInputType: 'utc',
        endOutputType: 'utc',
        recurrenceRule: GOOGLE_FREQ_BY_PERIOD[period] ? `FREQ=${GOOGLE_FREQ_BY_PERIOD[period]}` : '',
        busyStatus: 'FREE',
        transp: 'OPAQUE',
        created: getIcsDate(today, hour),
        lastModified: getIcsDate(today, hour),
      }))
    )

    if (error) return ''

    return value
  }
}
export const googleCalendar = new GoogleCalendar()
