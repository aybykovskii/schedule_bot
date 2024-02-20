import { BotCommand } from 'node-telegram-bot-api'
import { z } from 'zod'

import { Lang } from '../locale'
import { t } from '../i18n'

export const Commands = z.enum(['start', 'info', 'create', 'edit', 'change_locale'])
export type Command = z.infer<typeof Commands>
export type TelegramCommand = `/${Command}`

export const getCommands = (locale: Lang): BotCommand[] =>
  Object.values(Commands.Values).map((cmd) => ({
    command: `/${cmd}`,
    description: t({ phrase: `commands.${cmd}.description`, locale }),
  }))
