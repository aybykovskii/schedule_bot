import { calendar_v3, google } from 'googleapis'
import { RRule, RRuleSet } from 'rrule'
import dayjs from 'dayjs'

import { EventColorCodes, EventTransparency, GoogleEventStatuses, Periods, PromiseResponse } from '@/types'
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

  private getRecurrenceString(period: Periods): string[]

  private getRecurrenceString(period: Periods, exdates: string[], time: number): string[]

  private getRecurrenceString(period: Periods, exdates?: string[], time?: number): string[] {
    const rules: string[] = []

    if (period === Periods.Weekly) {
      const rrule = new RRule({
        freq: RRule.WEEKLY,
      })

      rules.push(rrule.toString())
    }

    exdates?.forEach((date) => {
      const set = new RRuleSet()

      set.exdate(dayjs(`${date} ${time}:00`).toDate())

      rules.push(set.toString())
    })

    return rules
  }

  private getEventInfoByStatus = ({ name, tg }: Event, status: GoogleEventStatuses) => {
    const isCancelled = status === GoogleEventStatuses.Cancelled

    return {
      summary: `${isCancelled ? 'Cancelled: ' : ''}${name} - ${tg}`,
      colorId: isCancelled ? EventColorCodes.Cancelled : EventColorCodes.Confirmed,
      transparency: isCancelled ? EventTransparency.Transparent : EventTransparency.Opaque,
      status: GoogleEventStatuses.Confirmed,
    }
  }

  private dateAsISO = (date: string, hour = this.startHour) => {
    const day = dayjs(hour ? `${date} ${hour}:00` : date)

    return day.toISOString()
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

  createEvent = async (event: Event, colorStatus = GoogleEventStatuses.Confirmed): PromiseResponse<GCEventId> => {
    const { date, time, period } = event
    const { summary, colorId, status, transparency } = this.getEventInfoByStatus(event, colorStatus)

    const result = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: {
        status,
        colorId,
        summary,
        transparency,
        recurrence: this.getRecurrenceString(period),
        ...this.getEventTime(date, time),
      },
    })

    if (!result.data.id) {
      return { success: false, error: 'Error while creating event' }
    }

    return { success: true, data: result.data.id }
  }

  updateEvent = async (eventId: string, event: Event): PromiseResponse<GCEvent> => {
    const { date, time, exceptionDates, period } = event
    const { summary, colorId, status, transparency } = this.getEventInfoByStatus(event, GoogleEventStatuses.Confirmed)

    const ev = {
      calendarId: this.calendarId,
      eventId,
      requestBody: {
        status,
        colorId,
        summary,
        transparency,
        recurrence: this.getRecurrenceString(period, exceptionDates, time),
        ...this.getEventTime(date, time),
      },
    }

    const result = await this.calendar.events.update(ev)

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
