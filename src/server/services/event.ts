import dayjs from 'dayjs'

import { Event } from '@/common/schemas'
import { Periods, ModelFields, PromiseResponse } from '@/types'
import { Log } from '@/common/logger'

import { EventModel } from '../models'

type CreateEventArg = Pick<Event, 'userId' | 'name' | 'tg'>
type ModelId = ModelFields['_id']
type UserId = Event['userId']
type EventDate = Event['date']

export class EventService {
  create = async (event: CreateEventArg): PromiseResponse<CreateEventArg & ModelFields> => {
    const result = await EventModel.create({ ...event, isFilled: false })

    if (result.errors) {
      Log.error(`Error while creating event: ${JSON.stringify(result.errors)}`)

      return { success: false, error: result.errors.message }
    }

    return { success: true, data: result.toObject() }
  }

  findById = async (id: ModelId): PromiseResponse<Event> => {
    const result = await EventModel.findById(id)

    if (!result || result.errors) {
      Log.error(`Error while reading event: ${JSON.stringify(result?.errors)}`)

      return { success: false, error: result?.errors?.message ?? 'Error while reading event' }
    }

    return { success: true, data: result.toObject() }
  }

  findUnfilled = async (userId: UserId): PromiseResponse<Partial<Event>> => {
    const result = await EventModel.findOne({ userId, isFilled: false })

    if (!result || result.errors) {
      Log.error(`Error while reading unfilled event: ${JSON.stringify(result?.errors)}`)

      return { success: false, error: result?.errors?.message ?? 'Error while reading unfilled event' }
    }

    return { success: true, data: result.toObject() }
  }

  readByUserId = async (userId: UserId, isFilled: boolean): PromiseResponse<Event[]> => {
    const data = await EventModel.find({ userId, isFilled })

    return { success: true, data }
  }

  findByDate = async (date: EventDate): PromiseResponse<Event[]> => {
    const day = dayjs(date).day()

    const data = await EventModel.find({
      isFilled: true,
      $or: [
        { period: Periods.Once, date },
        {
          period: Periods.Weekly,
          exceptionDates: { $ne: date },
          dayInWeek: day,
        },
      ],
    })

    return { success: true, data }
  }

  update = async (id: ModelId, event: Partial<Event>): PromiseResponse<Partial<Event>> => {
    const newEventFields = Object.entries(event).reduce(
      (acc, [key, value]) => (!value ? acc : { ...acc, [key]: value }),
      {} as Partial<Event>
    )

    const result = await EventModel.findOneAndUpdate({ _id: id }, { ...newEventFields }, { new: true })

    if (!result || result.errors) {
      Log.error(`Error while updating event: ${JSON.stringify(result?.errors)}`)

      return { success: false, error: result?.errors?.message ?? 'Error while updating event' }
    }

    return { success: true, data: result.toObject() }
  }

  addExceptionDate = async (id: ModelId, date: EventDate): PromiseResponse<Event> => {
    const result = await EventModel.findOneAndUpdate({ _id: id }, { $push: { exceptionDates: date } }, { new: true })

    if (!result || result?.errors) {
      Log.error(`Error while adding exception date: ${JSON.stringify(result?.errors)}`)

      return { success: false, error: result?.errors?.message ?? 'Error while adding exception date' }
    }

    return { success: true, data: result?.toObject() }
  }

  delete = async (id: ModelId): PromiseResponse<null> => {
    const event = await EventModel.findOne({ _id: id })

    const result = await event?.deleteOne()

    if (result?.errors) {
      Log.error(`Error while deleting event: ${JSON.stringify(result.errors)}`)

      return { success: false, error: result.errors.message }
    }

    return { success: true, data: null }
  }
}

export const eventService = new EventService()
