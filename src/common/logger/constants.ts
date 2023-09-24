export type LogType = 'info' | 'warn' | 'error'

export const COLOR_BY_LOG_TYPE: Record<LogType, string> = {
  info: '\x1b[96m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
}
