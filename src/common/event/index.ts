import { z } from 'zod'

import { MongooseBaseSchema } from '../mongoose'
import { env } from '../environment'

export const Periods = z.enum(['once', 'weekly'])
export const Actions = z.enum(['edit', 'cancel', 'delete'])

export const EventDraftSchema = MongooseBaseSchema.extend({
  userId: z.number(),
  period: Periods,
  date: z.string().regex(/^\d{1,2}\.\d{1,2}\.\d{4}$/),
  hour: z.number().min(env.START_HOUR).max(env.END_HOUR),
  weekDayNumber: z.number(),
  updateEventId: z.string().optional(),
})

export const EventSchema = EventDraftSchema.omit({ updateEventId: true }).extend({
  name: z.string(),
  tg: z.string().startsWith('@'),
  googleEventId: z.string(),
  exceptionDates: z.array(z.string()),
})

export type Period = z.infer<typeof Periods>
export type Action = z.infer<typeof Actions>
export type EventDraft = z.infer<typeof EventDraftSchema>
export type Event = z.infer<typeof EventSchema>
