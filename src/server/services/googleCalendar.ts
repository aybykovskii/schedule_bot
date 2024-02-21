import { calendar_v3, google } from 'googleapis'
import { RRule, RRuleSet } from 'rrule'
import dayjs from 'dayjs'

import { PromiseResponse } from '@/types'
import { env } from '@/common/environment'
import { Log } from '@/common/logger'
import { Event, Period } from '@/common/event'

import keys from './keys.json'

type GCEvent = calendar_v3.Schema$Event
type GCEventId = NonNullable<GCEvent['id']>
type Status = 'confirmed' | 'cancelled'

class GoogleCalendarService {
  private calendar

  private calendarId

  private startHour = env.START_HOUR

  private endHour = env.END_HOUR

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

  /**
 * @description Google Calendar allowed colors
 * @example
  '1': '#a4bdfc',
  '2': '#7ae7bf',
  '3': '#dbadff',
  '4': '#ff887c',
  '5': '#fbd75b',
  '6': '#ffb878',
  '7': '#46d6db',
  '8': '#e1e1e1',
  '9': '#5484ed',
  '10': '#51b749',
  '11': '#dc2127',
 */
  private colorByStatus = {
    confirmed: '10',
    cancelled: '11',
  }

  private getRecurrenceString(period: Period): string[]

  private getRecurrenceString(period: Period, exdates: string[], time: number): string[]

  private getRecurrenceString(period: Period, exdates?: string[], time?: number): string[] {
    const rules: string[] = []

    if (period === 'weekly') {
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

  private getEventDataByStatus = ({ name, tg }: Pick<Event, 'tg' | 'name'>, status: Status) => {
    const isCancelled = status === 'cancelled'

    return {
      summary: `${isCancelled ? 'Cancelled: ' : ''}${name} - ${tg}`,
      colorId: this.colorByStatus[status],
      transparency: isCancelled ? 'transparent' : 'opaque',
      status: 'confirmed',
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

  create = async (
    event: Omit<Event, '_id' | 'googleEventId'>,
    colorStatus: Status = 'confirmed',
  ): PromiseResponse<GCEventId> => {
    const { date, hour, period } = event
    const { summary, colorId, status, transparency } = this.getEventDataByStatus(event, colorStatus)

    const result = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: {
        status,
        colorId,
        summary,
        transparency,
        recurrence: this.getRecurrenceString(period),
        ...this.getEventTime(date, hour),
      },
    })

    if (!result.data.id) {
      return { success: false, error: 'Error while creating event' }
    }

    return { success: true, data: result.data.id }
  }

  read = async (date: string): PromiseResponse<GCEvent[]> => {
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

  update = async (eventId: string, event: Event): PromiseResponse<GCEvent> => {
    const { date, hour, exceptionDates, period } = event

    const result = await this.calendar.events.update({
      calendarId: this.calendarId,
      eventId,
      requestBody: {
        ...this.getEventDataByStatus(event, 'confirmed'),
        recurrence: this.getRecurrenceString(period, exceptionDates, hour),
        ...this.getEventTime(date, hour),
      },
    })

    if (!result.data) {
      return { success: false, error: 'Error while updating event' }
    }

    return { success: true, data: result.data }
  }

  delete = async (eventId: string): PromiseResponse<null> => {
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
  env.GOOGLE_CALENDAR_ID,
)
