import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import mongoose from 'mongoose'

import { env } from '@/common/environment'
import { loggerMiddleware } from '@/common/logger'
import { i18n } from '@/common/i18n'

import { rootTRPCRouter } from './trpc/router/router'

const app = express()

mongoose.connect(env.MONGODB_URL).then(() => {
  console.log('connected to mongoDB')
})

app.use(loggerMiddleware)
app.use(express.json())
app.use(i18n.init)
app.use('/trpc', createExpressMiddleware({ router: rootTRPCRouter }))

app.listen(env.SERVER_PORT, () => {
  console.log(`listening on port ${env.SERVER_PORT}`)
})

export { RootRouter } from './trpc/router/router'
