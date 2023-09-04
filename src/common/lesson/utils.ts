import { DeepPartial, LessonPageProperties, LessonPeriod, NotionPageProps } from '@/types'

import { env } from '../environment'

import { Lesson, lessonPeriod, lessonSchema } from './schemas'

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

export const isLessonFilled = (lesson: DeepPartial<Lesson>) => lessonSchema.safeParse(lesson).success

export const asNotionPage = ({ name, tg, time, date, period }: Lesson): NotionPageProps => ({
  parent: {
    database_id: env.NOTION_DATABASE_ID,
  },
  properties: {
    [LessonPageProperties.Name]: {
      type: 'title',
      title: [{ text: { content: `${name} - ${tg}` } }],
    },
    [LessonPageProperties.Date]: {
      type: 'date',
      date: {
        start: new Date(`${date} ${time}:00`).toISOString(),
      },
    },
    [LessonPageProperties.Period]: {
      type: 'select',
      select: {
        name: period,
      },
    },
  },
})
