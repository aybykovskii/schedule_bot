import { z } from 'zod'

import { Locales } from '@/types'

export const localeSchema = z.object({
  _id: z.object({}).optional(),
  __v: z.number().optional(),
  userId: z.number(),
  locale: z.nativeEnum(Locales),
})
