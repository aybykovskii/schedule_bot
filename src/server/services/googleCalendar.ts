import { calendar_v3, google } from 'googleapis'
import dayjs from 'dayjs'

import { EventPeriods, PromiseResponse } from '@/types'
import { env } from '@/common/environment'
import { Log } from '@/common/logger'
import { Event } from '@/common/schemas'

import keys from './keys.json'

type GCEvent = calendar_v3.Schema$Event
type GCEventId = NonNullable<GCEvent['id']>

class GoogleCalendarService {
  private calendar

  private calendarId

  private startHour = +env.START_HOUR

  private endHour = +env.END_HOUR

  constructor(botGmail: string, privateKey: string, scope: string, calendarId: string) {
    this.calendarId = calendarId
    const jwtClient = new google.auth.JWT(botGmail, undefined, privateKey, scope)

    jwtClient
      .authorize()
      .then(() => {
        Log.info('Google client authorized')
      })
      .catch((e) => {
        Log.error(`Catch error while authorizing google client: ${e}`)
      })

    this.calendar = google.calendar({
      version: 'v3',
      auth: jwtClient,
    })
  }

  private dateAsISO = (date: string, hour = this.startHour) => {
    const day = dayjs(hour ? `${date} ${hour}:00` : date)

    return day.toISOString()
  }

  private getPeriodRecurrence = (period: EventPeriods) => {
    return period === EventPeriods.Weekly ? [`RRULE:FREQ=${period.toUpperCase()}`] : []
  }

  private getEventTime = (date: string, hour: number) => {
    const timeZone = 'UTC'

    return {
      start: {
        dateTime: this.dateAsISO(date, hour),
        timeZone,
      },
      end: {
        dateTime: this.dateAsISO(date, hour + 1),
        timeZone,
      },
    }
  }

  readEventsByDate = async (date: string): PromiseResponse<GCEvent[]> => {
    const list = await this.calendar.events.list({
      calendarId: this.calendarId,
      timeMin: this.dateAsISO(date),
      timeMax: this.dateAsISO(date, this.endHour),
    })

    if (!list.data.items) {
      return { success: false, error: 'Error while reading events' }
    }

    return { success: true, data: list.data.items }
  }

  createEvent = async ({ date, time, name, tg, period }: Event): PromiseResponse<GCEventId> => {
    const transparency = 'opaque'
    const status = 'confirmed'

    const result = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: {
        summary: `${name} - ${tg}`,
        ...this.getEventTime(date, time),
        recurrence: this.getPeriodRecurrence(period),
        transparency,
        status,
      },
    })

    if (!result.data.id) {
      return { success: false, error: 'Error while creating event' }
    }

    return { success: true, data: result.data.id }
  }

  updateEvent = async (
    eventId: string,
    { name, tg, date, time, exceptionDates }: Partial<Event>
  ): PromiseResponse<GCEvent> => {
    const result = await this.calendar.events.update({
      calendarId: this.calendarId,
      eventId,
      requestBody: {
        ...(name && tg && { summary: `${name} - ${tg}` }),
        ...(date && time && this.getEventTime(date, time)),
        ...(exceptionDates && {
          recurrence: [
            ...this.getPeriodRecurrence(EventPeriods.Weekly),
            ...exceptionDates.map((d) => `EXDATE:${this.dateAsISO(d, 0)}`),
          ],
        }),
      },
    })

    if (!result.data) {
      return { success: false, error: 'Error while updating event' }
    }

    return { success: true, data: result.data }
  }

  deleteEvent = async (eventId: string): PromiseResponse<null> => {
    const result = await this.calendar.events.delete({
      calendarId: this.calendarId,
      eventId,
    })

    if (!result) {
      return { success: false, error: 'Error while deleting event' }
    }

    return { success: true, data: null }
  }
}
export const googleCalendarService = new GoogleCalendarService(
  env.GOOGLE_ACCOUNT_EMAIL,
  keys.GOOGLE_PRIVATE_KEY,
  env.GOOGLE_SCOPE,
  env.GOOGLE_CALENDAR_ID
)
