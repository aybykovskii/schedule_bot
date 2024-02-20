import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import { LocaleSchema, Languages } from '@/common/locale'
import { Assertion } from '@/common/assertion'

import { localeService } from '../services'

const t = initTRPC.create()
const { procedure } = t

export const localeRouter = t.router({
  set: procedure
    .input(LocaleSchema.omit({ _id: true }))
    .output(Languages)
    .query(async ({ input }) => {
      const { create, read, update } = localeService

      const findResult = await read(input.userId)

      Assertion.server(findResult)

      const result = await (findResult.data ? update : create)(input)

      Assertion.server(result)

      return result.data.locale
    }),

  get: procedure
    .input(z.number({ description: 'user id' }))
    .output(Languages.or(z.undefined()))
    .query(async ({ input: userId }) => {
      const result = await localeService.read(userId)

      Assertion.server(result)

      return result.data?.locale
    }),
})
