import { model, Schema } from 'mongoose'

import { Day, ModelNames, ModelObjectId } from '@/types'

export type Schedule = ModelObjectId & {
  day: Day
  start_at: number
  end_at: number
}

export const ScheduleSchema = new Schema<Schedule>({
  day: String,
  start_at: Number,
  end_at: Number,
})

export const ScheduleModel = model(ModelNames.Schedule, ScheduleSchema)
