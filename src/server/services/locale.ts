import { Schema, model } from 'mongoose'

import { PromiseResponse } from '@/types'
import { Locale } from '@/common/locale'

const LocaleModel = model<Locale>(
  'Locale',
  new Schema<Locale>({
    userId: Number,
    locale: String,
  }),
)

class LocaleService {
  create = async (locale: Omit<Locale, '_id'>): PromiseResponse<Locale> => {
    const result = await LocaleModel.create(locale)

    if (result.errors) {
      return { success: false, error: result.errors.message }
    }

    return { success: true, data: result.toObject() }
  }

  read = async (userId: number): PromiseResponse<Locale | null> => {
    const result = await LocaleModel.findOne({ userId })

    if (!result) {
      return { success: true, data: null }
    }

    return { success: true, data: result.toObject() }
  }

  update = async (locale: Omit<Locale, '_id'>): PromiseResponse<Locale> => {
    const result = await LocaleModel.findOneAndUpdate({ userId: locale.userId }, locale, { new: true })

    if (!result) {
      return { success: false, error: 'Error while updating locale' }
    }

    return { success: true, data: result.toObject() }
  }

  delete = async (userId: number): PromiseResponse<null> => {
    const result = await LocaleModel.findOneAndDelete({ userId })

    if (result?.errors) {
      return { success: false, error: result.errors.message }
    }

    return { success: true, data: null }
  }
}

export const localeService = new LocaleService()
