import { ObjectId } from 'mongoose'

export enum ModelNames {
  Event = 'Event',
  Locale = 'Locale',
}

export type ModelFields = {
  _id?: ObjectId
  __v?: number
}
