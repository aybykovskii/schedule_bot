import 'dotenv/config'

enum ENV_KEYS {
  MODE = 'MODE',
  TG_BOT_TOKEN = 'TG_BOT_TOKEN',
  MONGODB_URL = 'MONGODB_URL',
  SEVER_PORT = 'SERVER_PORT',
  START_HOUR = 'START_HOUR',
  END_HOUR = 'END_HOUR',
  GOOGLE_ACCOUNT_EMAIL = 'GOOGLE_ACCOUNT_EMAIL',
  GOOGLE_CALENDAR_ID = 'GOOGLE_CALENDAR_ID',
  GOOGLE_SCOPE = 'GOOGLE_SCOPE',
  DAY_OFF = 'DAY_OFF',
  // Создавать ли отмененные события в календаре при удалении события
  STORE_DELETED_EVENTS = 'STORE_DELETED_EVENTS',
}

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
