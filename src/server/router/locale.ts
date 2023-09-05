import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import { localeSchema } from '@/common/locale'
import { LocaleModel } from '@/server/models/locale'
import { Locales } from '@/types/locale'

const t = initTRPC.create()
const { procedure } = t

export const TRPCLocaleRouter = t.router({
  set: procedure.input(localeSchema).query(async ({ input: { userId, locale } }) => {
    const lc = await LocaleModel.findOne({ userId })

    if (lc) {
      const result = await LocaleModel.findOneAndUpdate({ userId }, { locale }, { new: true })

      return result?.toObject().locale
    }

    const result = await LocaleModel.create({ userId, locale })

    return result?.toObject().locale
  }),

  get: procedure.input(z.object({ userId: z.number() })).query(async ({ input: { userId } }) => {
    const lc = await LocaleModel.findOne({ userId })

    return lc ? lc.toObject().locale : Locales.En
  }),
})
