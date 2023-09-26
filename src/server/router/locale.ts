import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import { LocaleSchema } from '@/common/schemas'
import { Assertion } from '@/common/assertion'

import { localeService } from '../services'

const t = initTRPC.create()
const { procedure } = t

export const localeRouter = t.router({
  set: procedure.input(LocaleSchema).query(async ({ input }) => {
    const { create, read, update } = localeService

    const findResult = await read(input.userId)

    Assertion.server(findResult)

    const result = await (findResult.data ? update : create)(input)

    Assertion.server(result)

    return result.data.locale
  }),

  get: procedure.input(z.number()).query(async ({ input: userId }) => {
    const result = await localeService.read(userId)

    Assertion.server(result)

    return result.data?.locale
  }),
})
