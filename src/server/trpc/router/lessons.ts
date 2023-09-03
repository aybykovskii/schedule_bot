import { initTRPC } from '@trpc/server'
import { Client, isFullPageOrDatabase } from '@notionhq/client'

import { env } from '@/common/environment'
import { LessonPageProperties } from '@/types'
import { NotionLesson } from '@/server/notion/lesson'
import { getTimeHours, usualDate } from '@/common/date'
import { lessonSchema } from '@/common/lesson'

const notion = new Client({
  auth: env.NOTION_TOKEN,
})

const t = initTRPC.create()
const { procedure } = t

export const TRPCLessonsRouter = t.router({
  create: procedure.input(lessonSchema).query(async ({ input: { title, date, period } }) => {
    const lesson = new NotionLesson(title, date, period)

    const lessonPage = await notion.pages.create(lesson.asPage())

    return lessonPage
  }),

  getForDay: procedure.input(usualDate).query(async ({ input }) => {
    const query = await notion.databases.query({
      database_id: env.NOTION_DATABASE_ID,
      filter: {
        and: [
          {
            property: LessonPageProperties.Date,
            date: {
              after: new Date(`${input} 00:00`).toISOString(),
            },
          },
          {
            property: LessonPageProperties.Date,
            date: {
              before: new Date(`${input} 23:59`).toISOString(),
            },
          },
        ],
      },
    })

    return query.results
      .filter(isFullPageOrDatabase)
      .map((l) => l.properties[LessonPageProperties.Date])
      .reduce((acc, l) => {
        if (l.type === 'date') {
          acc.push(+getTimeHours(new Date(l.date!.start).toLocaleTimeString('ru')))
        }

        return acc
      }, [] as number[])
  }),
})
