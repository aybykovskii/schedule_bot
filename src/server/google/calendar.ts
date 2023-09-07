import * as ics from 'ics'
import { google } from 'googleapis'

import { Lesson } from '@/common/lesson'
import { getIcsDate, getJSONDate } from '@/common/date'
import { LessonPeriod } from '@/types'
import { env } from '@/common/environment'

import keys from './keys.json'

class GoogleCalendar {
  jwtClient

  calendar

  constructor() {
    this.jwtClient = new google.auth.JWT(env.GOOGLE_ACCOUNT_EMAIL, undefined, keys.GOOGLE_PRIVATE_KEY, env.GOOGLE_SCOPE)

    this.jwtClient.authorize().then(() => {
      console.log('Google client authorized')
    })

    this.calendar = google.calendar({
      version: 'v3',
      auth: this.jwtClient,
    })
  }

  getList = async () => {
    const list = await this.calendar.events.list({
      calendarId: env.GOOGLE_CALENDAR_ID,
    })

    console.log({ list: list.data.items?.[0] })
  }

  createEvent = async ({ date, time, name, tg, period }: Lesson) => {
    const result = await this.calendar.events.insert({
      calendarId: env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `${name} - ${tg}`,
        transparency: 'opaque',
        status: 'confirmed',
        start: {
          dateTime: getJSONDate(date, time),
          timeZone: 'UTC',
        },
        end: {
          dateTime: getJSONDate(date, time + 1),
          timeZone: 'UTC',
        },
        recurrence: period === LessonPeriod.Weekly ? [`RRULE:FREQ=${period.toUpperCase()}`] : null,
      },
    })

    return result.data
  }

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
