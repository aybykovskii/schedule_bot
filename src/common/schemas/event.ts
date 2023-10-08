import { z } from 'zod'

import { Periods } from '@/types'

import { env } from '../environment'

import { MongoModelSchema } from './mongo'

export const EventPeriodsEnum = z.nativeEnum(Periods)

/**
 * @description Event schema
 * @field name - user name from telegram
 * @field tg - telegram nickname
 * @field userId - user/chat id from telegram
 * @field time - event hour
 * @field date - event date format MM.DD.YYYY
 * @field dayInWeek - event day in week
 * @field period - event period
 * @field googleEventId - google event id
 * @field isFilled - is event has all required fields
 * @field datesMessageId - telegram message id with picked date info
 * @field timeMessageId - telegram message id with picked time info
 * @field exceptionDates - array of exception dates
 */
export const EventSchema = MongoModelSchema.extend({
  name: z.string(),
  tg: z.string().startsWith('@'),
  userId: z.number(),
  time: z.number().min(+env.START_HOUR).max(+env.END_HOUR),
  date: z.string(),
  dayInWeek: z.number(),
  period: EventPeriodsEnum,
  googleEventId: z.string(),
  isFilled: z.boolean(),
  datesMessageId: z.number().optional(),
  timeMessageId: z.number().optional(),
  exceptionDates: z.array(z.string()),
})

export type Event = z.infer<typeof EventSchema>
