import { initTRPC } from '@trpc/server'

import { eventRouter } from './event'
import { localeRouter } from './locale'

const t = initTRPC.create()

export const rootRouter = t.router({
  event: eventRouter,
  locale: localeRouter,
})

export type RootRouter = typeof rootRouter
