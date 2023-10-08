import { Schema, model } from 'mongoose'

import { ModelNames } from '@/types'
import { Locale } from '@/common/schemas'

export const LocaleModel = model(
  ModelNames.Locale,
  new Schema<Locale>({
    userId: Number,
    locale: String,
  })
)
