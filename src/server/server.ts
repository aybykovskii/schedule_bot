import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import mongoose from 'mongoose'

import { i18n } from '@/common/i18n'
import { env } from '@/common/environment'
import { loggerMiddleware } from '@/common/logger'

import { rootTRPCRouter } from './router'
import { LessonModel } from './models'
import { googleCalendar } from './google'

const app = express()

mongoose.connect(env.MONGODB_URL).then(() => {
  console.log('connected to mongoDB')
})

app.use(loggerMiddleware)
app.use(express.json())
app.use(i18n.init)

app.use('/trpc', createExpressMiddleware({ router: rootTRPCRouter }))
app.use('/ics', async (_, res) => {
  const lessons = await LessonModel.find({ isFilled: true })

  res.send(googleCalendar.asIcs(lessons))
})

app.listen(env.SERVER_PORT, () => {
  console.log(`listening on port ${env.SERVER_PORT}`)
})

export { RootRouter } from './router'
