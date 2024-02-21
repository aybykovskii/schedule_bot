import 'dotenv/config'
import { z } from 'zod'

import { Log } from '@/common/logger'

export const Days = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
export type Day = z.infer<typeof Days>

export const environmentSchema = z.object({
  MODE: z.enum(['development', 'production']),
  TG_BOT_TOKEN: z.string(),
  MONGODB_URL: z.string(),
  SERVER_PORT: z.string().transform(Number),
  START_HOUR: z.string().transform(Number),
  END_HOUR: z.string().transform(Number),
  GOOGLE_ACCOUNT_EMAIL: z.string(),
  GOOGLE_CALENDAR_ID: z.string(),
  GOOGLE_SCOPE: z.string(),
  DAY_OFF: z.string().optional().transform((val) => val?.split(',') as Day[]),
  // Создавать ли отмененные события в календаре при удалении события
  STORE_DELETED_EVENTS: z.string().optional().transform(Boolean),
})

export type EnvironmentSchema = z.infer<typeof environmentSchema>

class Environment {
  public keys: EnvironmentSchema

  constructor() {
    const env = environmentSchema.parse(process.env)

    Log.info('Starting with environment:', env)
    this.keys = env
  }
}

export const env = new Environment().keys
