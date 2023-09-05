import { ObjectId } from 'mongoose'

export enum ModelNames {
  Lesson = 'Lesson',
  Locale = 'Locale',
}

export type ModelObjectId = {
  _id?: ObjectId
  __v?: number
}
