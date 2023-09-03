import { model, ObjectId, Schema } from 'mongoose'

import { ModelNames } from '@/types'

export type WithObjectId = {
  _id?: ObjectId
}

export type Lesson = WithObjectId & {
  student: string
  date: number
}

export const LessonSchema = new Schema<Lesson>({
  date: Number,
  student: String,
})

export const LessonModel = model(ModelNames.Lesson, LessonSchema)
