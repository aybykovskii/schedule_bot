import { initTRPC } from '@trpc/server'

import { eventRouter } from './event'
import { localeRouter } from './locale'
import { eventDraftRouter } from './eventDraft'

const t = initTRPC.create()

export const rootRouter = t.router({
  event: eventRouter,
  eventDraft: eventDraftRouter,
  locale: localeRouter,
})

export type RootRouter = typeof rootRouter
