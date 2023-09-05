import { initTRPC } from '@trpc/server'

import { TRPCLessonsRouter } from './lessons'
import { TRPCLocaleRouter } from './locale'

const t = initTRPC.create()

export const rootTRPCRouter = t.router({
  lessons: TRPCLessonsRouter,
  locale: TRPCLocaleRouter,
})

export type RootRouter = typeof rootTRPCRouter
