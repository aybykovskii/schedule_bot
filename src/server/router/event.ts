import { initTRPC } from '@trpc/server'

import { usualDate } from '@/common/date'
import { ObjectIdSchema, assertIsLessonFilled, isLessonFilled } from '@/common/lesson'
import { Assertion } from '@/common/assertion'
import { EventSchema } from '@/common/schemas'

import { eventService, googleCalendarService } from '../services'

const t = initTRPC.create()
const { procedure } = t

export const eventRouter = t.router({
  create: procedure
    .input(EventSchema.pick({ userId: true, name: true, tg: true }))
    .query(async ({ input: { userId, name, tg } }) => {
      const unfilledEvent = await eventService.findUnfilled(userId)

      if (unfilledEvent.success) {
        return unfilledEvent.data
      }

      const createResult = await eventService.create({ userId, name, tg })

      Assertion.server(createResult)

      return createResult.data
    }),

  readAll: procedure.input(EventSchema.pick({ userId: true })).query(async ({ input: { userId } }) => {
    const readResult = await eventService.readByUserId(userId, true)

    Assertion.server(readResult)

    return readResult.data
  }),

  update: procedure
    .input(EventSchema.pick({ userId: true }).and(EventSchema.deepPartial()))
    .output(EventSchema.deepPartial())
    .query(async ({ input: { userId, ...lesson } }) => {
      const result = await eventService.findUnfilled(userId)

      Assertion.server(result)

      const isFilled = isLessonFilled({ ...result.data, ...lesson })

      const updateResult = await eventService.update(result.data._id, { ...lesson, isFilled })

      Assertion.server(updateResult)

      if (isFilled) {
        assertIsLessonFilled(updateResult.data)
        const createEventResult = await googleCalendarService.createEvent(updateResult.data)

        Assertion.server(createEventResult)

        await eventService.update(result.data._id, { googleEventId: createEventResult.data })
      }

      return updateResult.data
    }),

  addExceptionDate: procedure
    .input(EventSchema.pick({ _id: true, date: true }))
    .query(async ({ input: { _id: id, date } }) => {
      const result = await eventService.addExceptionDate(id, date)

      Assertion.server(result)

      return result.data
    }),

  delete: procedure.input(ObjectIdSchema).query(async ({ input: id }) => {
    const result = await eventService.delete(id)

    Assertion.server(result)

    return result.data
  }),

  getDateBusyHours: procedure.input(usualDate).query(async ({ input }) => {
    const result = await eventService.findByDate(input)

    Assertion.server(result)

    return result.data.map((lesson) => lesson.time)
  }),
})
