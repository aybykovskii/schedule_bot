import { Client } from '@notionhq/client'

import { LessonPageProperties, LessonPeriod } from '@/types'
import { Lesson, LessonDate } from '@/common/lesson'
import { env } from '@/common/environment'

type PageProps = Parameters<Client['pages']['create']>[0]

export class NotionLesson implements Lesson {
  title: string

  date: LessonDate

  period: LessonPeriod = LessonPeriod.Once

  constructor(title: string, date: LessonDate, period?: LessonPeriod) {
    this.title = title
    this.date = date

    if (period) {
      this.period = period
    }
  }

  asPage = (): PageProps => ({
    parent: {
      database_id: env.NOTION_DATABASE_ID,
    },
    properties: {
      [LessonPageProperties.Name]: {
        type: 'title',
        title: [{ text: { content: this.title } }],
      },
      [LessonPageProperties.Date]: {
        type: 'date',
        date: {
          start: new Date(this.date.start).toISOString(),
          end: this.date.end ? new Date(this.date.end).toISOString() : null,
        },
      },
      [LessonPageProperties.Period]: {
        type: 'select',
        select: {
          name: this.period,
        },
      },
    },
  })
}
