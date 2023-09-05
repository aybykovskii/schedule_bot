import { BotCommand, Message } from 'node-telegram-bot-api'

import { Commands, Locales } from '@/types'

import { t } from '../i18n'

export const getI18nCommands = (locale: Locales): BotCommand[] => [
  {
    command: Commands.START,
    description: t({ phrase: 'commands.start', locale }),
  },
  {
    command: Commands.CHANGE_LOCALE,
    description: t({ phrase: 'commands.change_locale', locale }),
  },
  {
    command: Commands.CREATE_A_LESSON,
    description: t({ phrase: 'commands.create_a_lesson', locale }),
  },
]

export const isCommand = (cmd: Commands, msg: Message) => cmd === msg.text
