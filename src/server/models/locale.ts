import { Schema, model } from 'mongoose'

import { Locale, ModelNames, ModelObjectId } from '@/types'

export const LocaleModel = model(
  ModelNames.Locale,
  new Schema<ModelObjectId & Locale>({
    userId: Number,
    locale: String,
  })
)
