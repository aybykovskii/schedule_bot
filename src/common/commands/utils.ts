import { BotCommand } from 'node-telegram-bot-api'

import { Commands, Locales } from '@/types'

import { t } from '../i18n'

const EXCLUDED_COMMANDS: Commands[] = []

export const toBotCommand = (cmd: Commands) => `/${cmd}`

export const getBotCommands = (locale: Locales): BotCommand[] =>
  Object.values(Commands)
    .filter((cmd) => !EXCLUDED_COMMANDS.includes(cmd))
    .map((cmd) => ({
      command: toBotCommand(cmd),
      description: t({ phrase: `commands.${cmd}.description`, locale }),
    }))
