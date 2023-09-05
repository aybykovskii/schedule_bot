import { z } from 'zod'

import { LessonPeriod } from '@/types'

import { env } from '../environment'

export const lessonPeriod = z.nativeEnum(LessonPeriod)

export const lessonSchema = z.object({
  _id: z.object({}).optional(),
  __v: z.number().optional(),
  name: z.string(),
  tg: z.string().startsWith('@'),
  userId: z.number(),
  time: z.number().min(+env.START_HOUR).max(+env.END_HOUR),
  date: z.string(),
  period: lessonPeriod,
  isFilled: z.boolean(),
})

export type Lesson = z.infer<typeof lessonSchema>
export type LessonDate = Lesson['date']
