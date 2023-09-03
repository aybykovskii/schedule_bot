import { z } from 'zod'

import { LessonPeriod } from '@/types'

export const lessonPeriod = z.nativeEnum(LessonPeriod)

export const lessonSchema = z.object({
  title: z.string(),
  date: z.object({
    start: z.string(),
    end: z.string().optional(),
  }),
  period: lessonPeriod,
})

export type Lesson = z.infer<typeof lessonSchema>
export type LessonDate = Lesson['date']
