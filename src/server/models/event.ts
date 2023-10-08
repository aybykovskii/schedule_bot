import { model, Schema } from 'mongoose'

import { Event } from '@/common/schemas'
import { ModelNames } from '@/types'

export const EventModel = model(
  ModelNames.Event,
  new Schema<Event>({
    userId: Number,
    name: String,
    tg: String,
    time: Number,
    period: String,
    isFilled: Boolean,
    date: String,
    dayInWeek: Number,
    googleEventId: String,
    datesMessageId: Number,
    timeMessageId: Number,
    exceptionDates: [String],
  })
)
