import 'dotenv/config'

import { ENV_KEYS } from '@/types'

class Environment {
  public keys: Record<ENV_KEYS, string>

  constructor() {
    this.keys = Object.values(ENV_KEYS).reduce(
      (acc, key) => ({ ...acc, [key]: process.env[key] ?? '' }),
      {} as Record<ENV_KEYS, string>,
    )
  }
}

export const env = new Environment().keys
