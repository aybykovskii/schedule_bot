import { ObjectId } from 'mongoose'

export enum ModelNames {
  Lesson = 'Lesson',
  Schedule = 'Schedule',
}

export type ModelObjectId = {
  _id?: ObjectId
  __v?: number
}
