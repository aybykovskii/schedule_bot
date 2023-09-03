import { BotCommand } from 'node-telegram-bot-api'

import { Commands } from '@/types'

export const commands: Record<Commands, BotCommand> = {
  START: {
    command: '/start',
    description: 'Запустить бота',
  },
  APPOINTMENT: {
    command: '/appointment',
    description: 'Записаться на занятие',
  },
}
