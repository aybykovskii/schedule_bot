import { z } from 'zod'

import { Locales } from '@/types'

import { MongoModelSchema } from './mongo'

export const LocalesEnum = z.nativeEnum(Locales)

/**
 * @description Locale schema
 * @field userId - user/chat id from telegram
 * @field locale - picked user locale
 */
export const LocaleSchema = MongoModelSchema.extend({
  userId: z.number(),
  locale: LocalesEnum,
})

export type Locale = z.infer<typeof LocaleSchema>
