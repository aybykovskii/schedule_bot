import { LessonPeriod } from '@/types'

export const GOOGLE_FREQ_BY_PERIOD: Record<LessonPeriod, string> = {
  [LessonPeriod.Once]: '',
  [LessonPeriod.Weak]: 'WEEKLY',
  [LessonPeriod.Month]: 'MONTHLY',
}
