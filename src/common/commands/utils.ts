import { Message } from 'node-telegram-bot-api'

import { Commands } from '@/types'

import { commands } from './constants'

export const isCommand = (cmd: Commands, msg: Message) => msg.text === commands[cmd].command
