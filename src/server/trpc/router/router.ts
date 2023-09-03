import { initTRPC } from '@trpc/server'

import { TRPCLessonsRouter } from './lessons'

const t = initTRPC.create()

export const rootTRPCRouter = t.router({
  lessons: TRPCLessonsRouter,
})

export type RootRouter = typeof rootTRPCRouter
