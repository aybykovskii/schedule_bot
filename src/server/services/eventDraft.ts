/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
import { Schema, model } from 'mongoose'

import { EventDraft } from '@/common/event'
import { FailedResponse, PromiseResponse } from '@/types'
import { Log } from '@/common/logger'

const EventDraftModel = model<EventDraft>(
  'EventDraft',
  new Schema<EventDraft>(
    {
      userId: Number,
      date: String,
      period: String,
      hour: Number,
      weekDayNumber: Number,
      updateEventId: String,
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

class EventDraftService {
  #errorHandler = <T extends { errors?: { message?: string } }>(
    result: T | undefined | null,
    message: 'creating' | 'reading' | 'updating' | 'deleting',
  ): FailedResponse | null => {
    if (!result) {
      Log.error(`Error while ${message} eventDraft`)

      return { success: false, error: `Error while ${message} eventDraft` }
    }

    if (result.errors) {
      Log.error(`Error while ${message} eventDraft: ${result.errors.message}`)

      return { success: false, error: `Error while ${message} eventDraft: ${result.errors.message}` }
    }

    return null
  }

  create = async (eventDraft: Pick<EventDraft, 'userId' | 'updateEventId'>): PromiseResponse<EventDraft['_id']> => {
    const result = await EventDraftModel.create(eventDraft)

    return this.#errorHandler(result, 'creating') ?? { success: true, data: result.toObject()._id }
  }

  readById = async (id: EventDraft['_id']): PromiseResponse<EventDraft> => {
    const result = await EventDraftModel.findById(id)

    return this.#errorHandler(result, 'reading') ?? { success: true, data: result!.toObject() }
  }

  readByUserId = async (userId: EventDraft['userId']): PromiseResponse<EventDraft> => {
    const result = await EventDraftModel.findOne({ userId })

    return this.#errorHandler(result, 'reading') ?? { success: true, data: result!.toObject() }
  }

  update = async (id: string, eventDraft: Partial<EventDraft>): PromiseResponse<EventDraft> => {
    const result = await EventDraftModel.findByIdAndUpdate(id, eventDraft, { new: true })

    return this.#errorHandler(result, 'updating') ?? { success: true, data: result!.toObject() }
  }

  delete = async (id: string): PromiseResponse<null> => {
    const result = await EventDraftModel.findByIdAndDelete(id)

    return this.#errorHandler(result, 'deleting') ?? { success: true, data: null }
  }

  deleteByUserId = async (userId: EventDraft['userId']): PromiseResponse<null> => {
    const result = await EventDraftModel.findOneAndDelete({ userId })

    return this.#errorHandler(result, 'deleting') ?? { success: true, data: null }
  }
}

export const eventDraftService = new EventDraftService()
