import { z } from 'zod'

import { MongooseBaseSchema } from '../mongoose'

export const Languages = z.enum(['ru', 'en', 'it'])

export const LocaleSchema = MongooseBaseSchema.extend({
  userId: z.number(),
  locale: Languages,
})

export type Lang = z.infer<typeof Languages>
export type Locale = z.infer<typeof LocaleSchema>

export const isLocale = (string: string): string is Lang => Languages.safeParse(string).success

export const getUserLocale = (lc?: string): Lang => (!lc || !isLocale(lc) ? 'en' : lc)
