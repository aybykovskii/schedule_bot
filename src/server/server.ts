import express from 'express'
import * as trpcExpress from '@trpc/server/adapters/express'

import { env } from '@/common/environment'
import { loggerMiddleware } from '@/common/logger'

import { rootTRPCRouter } from './trpc/router/router'

// app.use('/', new Router().router)

// app.listen(env.SERVER_PORT, () => {
//   console.log(`Server started on port ${env.SERVER_PORT}`)
// })

// const app = express()

// mongoose.connect(env.MONGODB_URL).then(() => {
//   console.log('connected to mongo')
// })

// const notion = new Client({
//   auth: env.NOTION_TOKEN,
// })

// app.use(express.json())

// app.post(
//   '/add_lesson',
//   async (
//     req: express.Request<{}, { page: CreatePageResponse }, { name: string; date: string; period: NotionPeriod }>,
//     res
//   ) => {
//     const { name, date, period } = req.body
//     const page = await notion.pages.create(new NotionLesson(name, date, period).asPage())

//     res.json({ page })
//   }
// )

/// Filter Day Lessons
//

// app.get('/day_lessons', async (req: express.Request<{}, {}, { date: string }>, res) => {
//   const {
//     body: { date },
//   } = req

//   const pages = await notion.databases.query({
//     database_id: env.NOTION_DATABASE_ID,
//     filter: {
//       and: [
//         {
//           property: 'Date',
//           date: {
//             after: new Date(`${date} 00:00`).toISOString(),
//           },
//         },
//         {
//           property: 'Date',
//           date: {
//             before: new Date(`${date} 23:59`).toISOString(),
//           },
//         },
//       ],
//     },
//   })

//   console.log('date: ', date)
//   console.log('lessons: ', pages.results)
//   console.log(
//     'time: ',
//     pages.results.map((l) => (isFullPageOrDatabase(l) ? l.properties[LessonPageProperties.Date] : undefined))
//   )
//   res.json({ lessons: pages.results })
// })

// ------------------------------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------------------------------------------------------

const app = express()

app.use(loggerMiddleware)

app.use('/trpc', trpcExpress.createExpressMiddleware({ router: rootTRPCRouter }))

app.listen(env.SERVER_PORT, () => {
  console.log(`listening on port ${env.SERVER_PORT}`)
})

export { RootRouter } from './trpc/router/router'
