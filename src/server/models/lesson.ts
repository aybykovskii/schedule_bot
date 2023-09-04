import { model, Schema } from 'mongoose'

import { Lesson } from '@/common/lesson'
import { ModelNames, ModelObjectId } from '@/types'

export const LessonModel = model(
  ModelNames.Lesson,
  new Schema<ModelObjectId & Lesson>({
    userId: Number,
    name: String,
    tg: String,
    time: Number,
    period: String,
    isFilled: Boolean,
    date: String,
  })
)
