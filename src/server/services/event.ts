import dayjs from 'dayjs'

import { Event } from '@/common/schemas'
import { EventPeriods, ModelFields, PromiseResponse } from '@/types'
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

  findUnfilled = async (userId: UserId): PromiseResponse<Partial<Event>> => {
    const result = await EventModel.findOne({ userId, isFilled: false })

    if (!result || result.errors) {
      Log.error(`Error while reading unfilled event: ${JSON.stringify(result?.errors)}`)

      return { success: false, error: result?.errors?.message ?? 'Error while reading unfilled event' }
    }

    return { success: true, data: result.toObject() }
  }

  readByUserId = async (userId: UserId, isFilled: boolean): PromiseResponse<Partial<Event>[]> => {
    const data = await EventModel.find({ userId, isFilled })

    return { success: true, data }
  }

  findByDate = async (date: EventDate): PromiseResponse<Event[]> => {
    const day = dayjs(date).day()

    const data = await EventModel.find({
      isFilled: true,
      $or: [
        { period: EventPeriods.Once, date },
        {
          period: EventPeriods.Weekly,
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
    const result = await EventModel.findOneAndUpdate({ _id: id }, { $push: { exceptionDates: date } })

    if (!result || result?.errors) {
      Log.error(`Error while adding exception date: ${JSON.stringify(result?.errors)}`)

      return { success: false, error: result?.errors?.message ?? 'Error while adding exception date' }
    }

    return { success: true, data: result?.toObject() }
  }

  delete = async (id: ModelId): PromiseResponse<null> => {
    const result = await EventModel.findOneAndDelete({ _id: id })

    if (result?.errors) {
      Log.error(`Error while deleting event: ${JSON.stringify(result.errors)}`)

      return { success: false, error: result.errors.message }
    }

    return { success: true, data: null }
  }
}

export const eventService = new EventService()
