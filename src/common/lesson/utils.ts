import { LessonPeriod } from '@/types'

import { lessonPeriod } from './schemas'

export const isLessonPeriod = (period: string): period is LessonPeriod => lessonPeriod.safeParse(period).success

export const getButtonTextByPeriod = (period: LessonPeriod) => {
  switch (period) {
    case LessonPeriod.Once:
      return 'Один раз'

    case LessonPeriod.Weak:
      return 'Каждую неделю'

    case LessonPeriod.Month:
      return 'Каждый месяц'

    default:
      period satisfies never

      return ''
  }
}
