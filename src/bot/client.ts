import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import dayjs from 'dayjs'

import '@/common/polyfill/polyfill'

import { Commands } from '@/types'
import { env } from '@/common/environment'
import { RootRouter } from '@/server/server'
import { DATE_FORMAT } from '@/common/date'
import { Log } from '@/common/logger'
import { Assertion } from '@/common/assertion'
import { toBotCommand } from '@/common/commands'
import {
  eventActionCD,
  eventCreateDateCD,
  eventPeriodCD,
  eventIdCD,
  eventTimeCD,
  localeCD,
  nextDatesCD,
  previousDatesCD,
  eventActionDateCD,
} from '@/common/callbackData'

import { Bot } from './bot'

const trpc = createTRPCProxyClient<RootRouter>({
  links: [httpBatchLink({ url: `http://localhost:${env.SERVER_PORT}/trpc` })],
})

const bot = new Bot(env.TG_BOT_TOKEN, trpc)

const startBot = async () => {
  bot.on('message', async (message) => {
    const { text, userId, locale } = await bot.getMessageInfo(message)

    switch (text) {
      case toBotCommand(Commands.START): {
        await bot.changeChatLocale(userId, locale)
        await bot.send(message, 'commands.start.message')
        break
      }

      case toBotCommand(Commands.CHANGE_LOCALE): {
        await bot.sendLocales(message)
        break
      }

      case toBotCommand(Commands.CREATE): {
        await bot.initiateEvent(message)
        break
      }

      case toBotCommand(Commands.EDIT): {
        await bot.sendUserEvents(message)
        break
      }

      case toBotCommand(Commands.INFO): {
        await bot.send(message, 'commands.info.message')
        break
      }

      default: {
        Log.info('Unknown command: ', text)
        await bot.send(message, 'unknown_command')
      }
    }
  })

  bot.on('callback_query', async (query) => {
    try {
      const { data, message } = query

      Assertion.client(data, 'Callback query must have data')
      Assertion.client(message, 'Callback query must have message')

      switch (true) {
        case localeCD.match(data): {
          await bot.setLocale(message, data)
          break
        }

        case eventCreateDateCD.match(data): {
          await bot.sendTime(message, data)
          break
        }

        case eventTimeCD.match(data): {
          await bot.sendPeriods(message, data)
          break
        }

        case eventPeriodCD.match(data): {
          bot.submitEvent(message, data)
          break
        }

        case previousDatesCD.match(data): {
          const { date } = previousDatesCD.get(data)

          await bot.delete(message)

          const startFrom = dayjs(date).subtract(7, 'days').format(DATE_FORMAT)

          await bot.sendDates(message, startFrom)
          break
        }

        case nextDatesCD.match(data): {
          const { date } = nextDatesCD.get(data)

          await bot.delete(message)

          const startFrom = dayjs(date).add(7, 'days').format(DATE_FORMAT)

          await bot.sendDates(message, startFrom)
          break
        }

        case eventIdCD.match(data): {
          await bot.sendEventActions(message, data)
          break
        }

        case eventActionCD.match(data): {
          await bot.handleActions(message, data)
          break
        }

        case eventActionDateCD.match(data): {
          await bot.sendActionResult(message, data)
          break
        }

        default: {
          Log.info('Unknown callback query: ', data)
          await bot.send(message, 'unknown_command')
        }
      }
    } catch (e) {
      Log.error('Error: ', e)
    }
  })
}

startBot()
  .then(() => {
    Log.info('Bot is running')
  })
  .catch(Log.error)
