import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import { Assertion } from '@/common/assertion'
import { EventSchema } from '@/common/event'
import { env } from '@/common/environment'

import { eventService, googleCalendarService } from '../services'

const t = initTRPC.create()
const { procedure } = t

export const eventRouter = t.router({
  create: procedure
    .input(EventSchema.omit({ _id: true, googleEventId: true }))
    .output(z.string({ description: 'event id' }))
    .query(async ({ input }) => {
      const createResult = await eventService.create(input)

      Assertion.server(createResult)

      const createEventResult = await googleCalendarService.create(input)

      Assertion.server(createEventResult)

      await eventService.update(createResult.data, { googleEventId: createEventResult.data })

      return createResult.data
    }),

  getById: procedure
    .input(z.string({ description: 'event id' }))
    .output(EventSchema)
    .query(async ({ input: id }) => {
      const readResult = await eventService.readById(id)

      Assertion.server(readResult)

      return readResult.data
    }),

  getByUserId: procedure
    .input(z.number({ description: 'user id' }))
    .output(z.array(EventSchema))
    .query(async ({ input }) => {
      const readResult = await eventService.readByUserId(input)

      Assertion.server(readResult)

      return readResult.data
    }),

  update: procedure
    .input(EventSchema.pick({ _id: true }).and(EventSchema.partial()))
    .output(EventSchema)
    .query(async ({ input }) => {
      const updateResult = await eventService.update(input._id, input)

      Assertion.server(updateResult)

      const calendarUpdateResult = await googleCalendarService.update(
        updateResult.data.googleEventId,
        updateResult.data,
      )

      Assertion.server(calendarUpdateResult)

      return updateResult.data
    }),

  addExceptionDate: procedure
    .input(EventSchema.pick({ _id: true, date: true }))
    .output(EventSchema)
    .query(async ({ input: { _id: id, date } }) => {
      const result = await eventService.addExceptionDate(id, date)

      Assertion.server(result)

      const {
        data,
        data: { googleEventId },
      } = result

      await googleCalendarService.update(googleEventId, data)

      await googleCalendarService.create(
        {
          ...data,
          date,
          period: 'once',
          exceptionDates: [],
        },
        'cancelled',
      )

      return result.data
    }),

  delete: procedure
    .input(z.string({ description: 'event id' }))
    .output(z.null())
    .query(async ({ input: id }) => {
      const result = await eventService.readById(id)

      Assertion.server(result)

      await googleCalendarService.delete(result.data.googleEventId)
      await eventService.delete(id)

      if (env.STORE_DELETED_EVENTS) {
        await googleCalendarService.create(result.data, 'cancelled')
      }

      return null
    }),

  deleteOutdated: procedure.output(z.null()).query(async () => {
    const result = await eventService.deleteOutdated()

    Assertion.server(result)

    return null
  }),

  getDateBusyHours: procedure
    .input(EventSchema.pick({ date: true, period: true }))
    .output(z.array(z.number()))
    .query(async ({ input }) => {
      const result = await eventService.readByDateAndPeriod(input)

      Assertion.server(result)

      return result.data.map((event) => event.hour)
    }),
})
