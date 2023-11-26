import { initTRPC } from '@trpc/server'

import { assertIsEventFilled, isEventFilled } from '@/common/event'
import { Assertion } from '@/common/assertion'
import { EventSchema, ObjectIdSchema, UsualDate } from '@/common/schemas'
import { GoogleEventStatuses, Periods } from '@/types'

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

  readById: procedure.input(ObjectIdSchema).query(async ({ input: id }) => {
    const readResult = await eventService.findById(id)

    Assertion.server(readResult)

    return readResult.data
  }),

  findUnfilled: procedure.input(EventSchema.pick({ userId: true })).query(async ({ input: { userId } }) => {
    const readResult = await eventService.findUnfilled(userId)

    Assertion.server(readResult)

    return readResult.data
  }),

  readAll: procedure.input(EventSchema.pick({ userId: true })).query(async ({ input: { userId } }) => {
    const readResult = await eventService.readByUserId(userId, true)

    Assertion.server(readResult)

    return readResult.data
  }),

  update: procedure
    .input(EventSchema.pick({ userId: true }).and(EventSchema.partial()))
    .output(EventSchema.partial())
    .query(async ({ input: { userId, ...event } }) => {
      const result = await eventService.findUnfilled(userId)

      Assertion.server(result)

      const isFilled = isEventFilled({ ...result.data, ...event })

      const updateResult = await eventService.update(result.data._id, { ...event, isFilled })

      Assertion.server(updateResult)

      if (isFilled) {
        assertIsEventFilled(updateResult.data)
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

      const {
        data,
        data: { googleEventId },
      } = result

      await googleCalendarService.updateEvent(googleEventId, data)

      await googleCalendarService.createEvent(
        {
          ...data,
          date,
          period: Periods.Once,
          exceptionDates: [],
        },
        GoogleEventStatuses.Cancelled,
      )

      return result.data
    }),

  delete: procedure.input(ObjectIdSchema).query(async ({ input: id }) => {
    const result = await eventService.findById(id)

    Assertion.server(result)

    await googleCalendarService.deleteEvent(result.data.googleEventId)
    await googleCalendarService.createEvent(result.data, GoogleEventStatuses.Cancelled)

    await eventService.delete(id)

    return null
  }),

  getDateBusyHours: procedure.input(UsualDate).query(async ({ input }) => {
    const result = await eventService.findByDate(input)

    Assertion.server(result)

    return result.data.map((event) => event.time)
  }),

  getTimeStampAvailablePeriods: procedure
    .input(EventSchema.pick({ date: true, time: true, dayInWeek: true }))
    .query(async ({ input }) => {
      const result = await eventService.findByDayAndTime(input)

      Assertion.server(result)

      return result.data.length ? [Periods.Once] : Object.values(Periods)
    }),
})
