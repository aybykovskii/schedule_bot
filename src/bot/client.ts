import dayjs from 'dayjs'
import { fetch as undiciFetch } from 'undici'
import { FetchEsque } from '@trpc/client/dist/internals/types'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'

import { env } from '@/common/environment'
import { RootRouter } from '@/server/server'
import { DATE_FORMAT } from '@/common/date'
import { Log } from '@/common/logger'
import { Assertion } from '@/common/assertion'
import {
  eventActionCD,
  eventDateCD,
  eventPeriodCD,
  eventIdCD,
  eventHourCD,
  localeCD,
  nextDatesCD,
  previousDatesCD,
  eventActionDateCD,
} from '@/common/callbackData'
import { inlineKeyboard } from '@/common/keyboard'
import { TelegramCommand } from '@/common/commands'
import { Period } from '@/common/event'
import { t } from '@/common/i18n'

import { Bot } from './bot'

const trpc = createTRPCProxyClient<RootRouter>({
  links: [
    httpBatchLink({
      url: `http://localhost:${env.SERVER_PORT}/trpc`,
      fetch: undiciFetch as FetchEsque,
    }),
  ],
})

const bot = new Bot(env.TG_BOT_TOKEN, trpc)

bot.setChatMenuButton({ menu_button: { type: 'commands' } })

const startBot = async () => {
  bot.on('message', async (message) => {
    const { text, userId, locale } = await bot.getMessageInfo<TelegramCommand>(message)

    switch (text) {
      case '/start': {
        await bot.changeChatLocale(userId, locale)
        await bot.send(message, 'commands.start.message')
        break
      }

      case '/change_locale': {
        await bot.send(message, 'commands.change_locale.message', undefined, inlineKeyboard.locales)

        break
      }

      case '/create': {
        await bot.initializeEventDraft(message)

        await bot.send(message, 'message.period', undefined, inlineKeyboard.periods(locale))
        break
      }

      case '/edit': {
        await bot.initializeEventDraft(message)

        const events = await trpc.event.getByUserId.query(userId)

        const editableEvents = events.filter(
          ({ period, date }) => period === 'weekly' || dayjs(date).isAfter(dayjs()),
        )

        await bot.send(
          message,
          'commands.edit.message',
          undefined,
          inlineKeyboard.events({ events: editableEvents, locale }),
        )
        break
      }

      case '/info': {
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

      const {
        userId,
        locale,
        chat: { username, first_name: name = '' },
      } = await bot.getMessageInfo(message)

      switch (true) {
        case localeCD.match(data): {
          await bot.delete(message)

          await bot.changeChatLocale(userId, locale)

          await bot.send(message, 'locale.set')
          break
        }

        case eventPeriodCD.match(data): {
          const { period } = eventPeriodCD.get<{ period: Period }>(data)

          await trpc.eventDraft.update.query({ userId, period })
          await bot.sendDates(message, { period })
          await bot.delete(message)
          break
        }

        case eventDateCD.match(data): {
          const { date } = eventDateCD.get(data)

          const { period } = await trpc.eventDraft.update.query({ userId, date, weekDayNumber: dayjs(date).day() })

          const busyHours = await trpc.event.getDateBusyHours.query({ date, period })

          await bot.send(message, 'message.time', undefined, inlineKeyboard.hours({ exceptions: busyHours }))

          await bot.delete(message)
          break
        }

        case eventHourCD.match(data): {
          const { hour: h } = eventHourCD.get(data)

          const { date, hour, period, weekDayNumber, updateEventId } = await trpc.eventDraft.update.query({
            userId,
            hour: +h,
          })

          if (updateEventId) {
            await trpc.event.update.query({ _id: updateEventId, date, hour, weekDayNumber })
          } else {
            await trpc.event.create.query({
              date,
              hour,
              period,
              weekDayNumber,
              userId,
              name,
              tg: `@${username}`,
              exceptionDates: [],
            })
          }

          await bot.delete(message)
          await bot.send(message, 'message.result', {
            time: `${hour}:00`,
            period: t({ phrase: `periods.${period}`, locale }),
            date: dayjs(date).toDate().toLocaleDateString(locale),
          })

          break
        }

        case previousDatesCD.match(data): {
          const { date } = previousDatesCD.get(data)

          await bot.delete(message)

          await bot.sendDates(message, { startFrom: dayjs(date).format(DATE_FORMAT), action: 'subtract' })
          break
        }

        case nextDatesCD.match(data): {
          const { date } = nextDatesCD.get(data)

          await bot.delete(message)

          await bot.sendDates(message, { startFrom: dayjs(date).format(DATE_FORMAT) })
          break
        }

        case eventIdCD.match(data): {
          const { id } = eventIdCD.get<{ id: string }>(data)
          const { period } = await trpc.event.getById.query(id)

          await bot.delete(message)

          await bot.send(
            message,
            'message.event_actions',
            undefined,
            inlineKeyboard.eventActions({ id, locale, period }),
          )
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
      Log.error(e)
    }
  })
}

startBot()
  .then(() => {
    Log.info('Bot is running')
  })
  .catch(Log.error)
