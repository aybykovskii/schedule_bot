/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dayjs from 'dayjs'
import { model, Schema } from 'mongoose'

import { Event } from '@/common/event'
import { PromiseResponse, FailedResponse } from '@/types'
import { Log } from '@/common/logger'
import { DATE_FORMAT } from '@/common/date'

const EventModel = model<Event>(
  'Event',
  new Schema<Event>(
    {
      userId: Number,
      name: String,
      tg: String,
      hour: Number,
      period: String,
      date: String,
      weekDayNumber: Number,
      googleEventId: String,
      exceptionDates: [String],
    },
    {
      toObject: {
        transform: (_doc, ret) => {
          ret._id = _doc._id?.toString()

          return ret
        },
      },
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    },
  ),
)

export class EventService {
  #errorHandler = <T extends { errors?: { message?: string } }>(
    result: T | undefined | null,
    message: 'creating' | 'reading' | 'reading unfilled' | 'updating' | 'deleting' | 'adding exception dates to',
  ): FailedResponse | null => {
    const errorMessage = `Error while ${message} event`

    if (!result) {
      Log.error(errorMessage)

      return { success: false, error: errorMessage }
    }

    if (!result.errors) return null

    Log.error(`${errorMessage}: ${JSON.stringify(result.errors)}`)

    return { success: false, error: result.errors.message ?? errorMessage }
  }

  create = async (event: Omit<Event, '_id' | 'googleEventId'>): PromiseResponse<Event['_id']> => {
    const result = await EventModel.create(event)

    return this.#errorHandler(result, 'creating') ?? { success: true, data: result.toObject()._id }
  }

  readById = async (id: Event['_id']): PromiseResponse<Event> => {
    const result = await EventModel.findById(id)

    return this.#errorHandler(result, 'reading') ?? { success: true, data: result!.toObject() }
  }

  readByUserId = async (userId: Event['userId']): PromiseResponse<Event[]> => {
    const data = await EventModel.find({ userId })

    return { success: true, data: data.map((event) => event.toObject()) }
  }

  readByDateAndPeriod = async ({ date, period }: Pick<Event, 'date' | 'period'>): PromiseResponse<Event[]> => {
    const weekDayNumber = dayjs(date).day()

    const result = await EventModel.find(
      period === 'weekly'
        ? {
            $or: [
              { period: 'once', date },
              { period: 'weekly', weekDayNumber },
            ],
          }
        : {
            $or: [
              { period, date },
              {
                period: 'weekly',
                exceptionDates: { $ne: date },
                weekDayNumber,
              },
            ],
          },
    )

    return { success: true, data: result.map((event) => event.toObject()) }
  }

  readByDayAndTime = async ({
    date,
    hour,
    weekDayNumber,
  }: Pick<Event, 'date' | 'hour' | 'weekDayNumber'>): PromiseResponse<Event[]> => {
    const data = await EventModel.find({
      isFilled: true,
      $or: [
        { period: 'once', date, hour },
        { period: 'weekly', weekDayNumber, hour },
        { period: 'weekly', date, hour },
      ],
    })

    return { success: true, data: data.map((event) => event.toObject()) }
  }

  update = async (id: Event['_id'], event: Partial<Event>): PromiseResponse<Event> => {
    const result = await EventModel.findOneAndUpdate({ _id: id }, event, { new: true })

    return this.#errorHandler(result, 'updating') ?? { success: true, data: result!.toObject() }
  }

  addExceptionDate = async (id: Event['_id'], date: Event['date']): PromiseResponse<Event> => {
    const result = await EventModel.findOneAndUpdate({ _id: id }, { $push: { exceptionDates: date } }, { new: true })

    return this.#errorHandler(result, 'adding exception dates to') ?? { success: true, data: result!.toObject() }
  }

  delete = async (id: Event['_id']): PromiseResponse<null> => {
    const result = await EventModel.findOneAndDelete({ _id: id })

    return this.#errorHandler(result, 'deleting') ?? { success: true, data: null }
  }

  deleteOutdated = async (): PromiseResponse<null> => {
    const result = await EventModel.deleteMany({ period: 'once', date: { $lt: dayjs().format(DATE_FORMAT) } })

    Log.info(`Deleted ${result.deletedCount} outdated events`)

    return { success: true, data: null }
  }
}

export const eventService = new EventService()
