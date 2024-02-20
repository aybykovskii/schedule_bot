import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import { EventDraftSchema } from '@/common/event'
import { Assertion } from '@/common/assertion'

import { eventDraftService } from '../services'

const t = initTRPC.create()
const { procedure } = t

export const eventDraftRouter = t.router({
  create: procedure
    .input(
      EventDraftSchema.pick({ userId: true, updateEventId: true }).and(
        EventDraftSchema.pick({ period: true }).partial(),
      ),
    )
    .output(z.string({ description: 'eventDraft id' }).or(z.undefined()))
    .query(async ({ input }) => {
      const result = await eventDraftService.create(input)

      Assertion.server(result)

      return result.data
    }),

  getById: procedure
    .input(z.string())
    .output(EventDraftSchema)
    .query(async ({ input }) => {
      const result = await eventDraftService.readById(input)

      Assertion.server(result)

      return result.data
    }),

  getByUserId: procedure
    .input(z.number())
    .output(EventDraftSchema)
    .query(async ({ input }) => {
      const result = await eventDraftService.readByUserId(input)

      Assertion.server(result)

      return result.data
    }),

  update: procedure
    .input(EventDraftSchema.partial().and(EventDraftSchema.pick({ userId: true })))
    .query(async ({ input }) => {
      const findResult = await eventDraftService.readByUserId(input.userId)

      Assertion.server(findResult)

      const result = await eventDraftService.update(findResult.data._id, input)

      Assertion.server(result)

      return result.data
    }),

  delete: procedure
    .input(z.string({ description: 'eventDraft id' }))
    .output(z.null())
    .query(async ({ input }) => {
      const result = await eventDraftService.delete(input)

      Assertion.server(result)

      return result.data
    }),

  deleteByUserId: procedure
    .input(z.number({ description: 'userId' }))
    .output(z.null())
    .query(async ({ input }) => {
      const findResult = await eventDraftService.readByUserId(input)

      if (!findResult.success) return null

      const result = await eventDraftService.deleteByUserId(input)

      Assertion.server(result)

      return result.data
    }),
})
