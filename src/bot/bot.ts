import TelegramBot, { Message } from 'node-telegram-bot-api'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'

import '@/common/polyfill/polyfill'

import { Commands, LessonPeriod, Locales } from '@/types'
import { t } from '@/common/i18n'
import { env } from '@/common/environment'
import { RootRouter } from '@/server/server'
import { isUsualDate, isUsualTime } from '@/common/date'
import { getI18nCommands } from '@/common/commands'
import { getButtonTextByPeriod, isLessonPeriod } from '@/common/lesson'
import {
  getDatesInlineKeyboard,
  getLocalesInlineKeyboard,
  getPeriodsInlineKeyboard,
  getTimeInlineKeyboard,
} from '@/common/messages'
import { getUserLocale, isLocale } from '@/common/locale'

const Bot = new TelegramBot(env.TG_BOT_TOKEN, { polling: true })

const trpc = createTRPCProxyClient<RootRouter>({
  links: [httpBatchLink({ url: `http://localhost:${env.SERVER_PORT}/trpc` })],
})

const sendMessage = async (msg: Message, text: string, options?: TelegramBot.SendMessageOptions) => {
  const chatId = msg.chat?.id

  await Bot.sendMessage(chatId, text, options)
}

const changeChatLocale = async (chatId: number, userId: number, lc?: string | Locales) => {
  const locale = getUserLocale(lc)

  await Bot.setMyCommands(getI18nCommands(locale))
  await Bot.setChatMenuButton({ chat_id: chatId, menu_button: { type: 'commands' } })
  const newLocale = await trpc.locale.set.query({ userId, locale })

  return newLocale
}

const startBot = async () => {
  Bot.on('message', async (message) => {
    const { from } = message

    if (!from) return

    const locale = await trpc.locale.get.query({ userId: from.id })

    switch (message.text) {
      case Commands.START: {
        await changeChatLocale(message.chat.id, from.id, from.language_code)
        await sendMessage(message, t({ phrase: 'start', locale }))
        break
      }

      case Commands.CHANGE_LOCALE: {
        await sendMessage(message, t({ phrase: 'locale', locale }), {
          reply_markup: { inline_keyboard: getLocalesInlineKeyboard() },
        })
        break
      }

      case Commands.CREATE_A_LESSON: {
        if (!message.from) return
        const {
          from: { id: userId, first_name: name, username },
        } = message

        await trpc.lessons.create.query({ name, userId, tg: `@${username}` })

        await sendMessage(message, t({ phrase: 'time', locale }), {
          reply_markup: { inline_keyboard: getDatesInlineKeyboard(locale) },
        })
        break
      }

      default: {
        await sendMessage(message, t({ phrase: 'unknown_command', locale }))
      }
    }
  })

  Bot.on('callback_query', async (query) => {
    try {
      const {
        data,
        message,
        from: { id: userId },
      } = query

      if (!data || !message) return

      const {
        message_id: messageId,
        chat: { id: chatId },
      } = message
      const messageIdString = messageId.toString()

      const locale = await trpc.locale.get.query({ userId })

      switch (true) {
        case isLocale(data): {
          const newLocale = await changeChatLocale(chatId, userId, data)

          await Bot.deleteMessage(chatId, messageIdString)

          await sendMessage(message, t({ phrase: 'locale_set', locale: newLocale }))
          break
        }

        case isUsualDate(data): {
          await trpc.lessons.update.query({ userId, date: data })

          const busyHours = await trpc.lessons.getBusyHours.query(data)

          await Bot.deleteMessage(chatId, messageIdString)

          await sendMessage(message, t({ phrase: 'date', locale }), {
            reply_markup: {
              inline_keyboard: getTimeInlineKeyboard(busyHours),
            },
          })
          break
        }

        case isUsualTime(data): {
          await trpc.lessons.update.query({ userId, time: +data })

          await Bot.deleteMessage(chatId, messageIdString)

          await sendMessage(message, t({ phrase: 'period', locale }), {
            reply_markup: { inline_keyboard: getPeriodsInlineKeyboard(locale) },
          })
          break
        }

        case isLessonPeriod(data): {
          const lesson = await trpc.lessons.update.query({ userId, period: data as LessonPeriod })

          await Bot.deleteMessage(chatId, messageIdString)

          const { date, time, period } = lesson

          await sendMessage(
            message,
            t(
              { phrase: 'result', locale },
              {
                time: `${time}:00`,
                period: getButtonTextByPeriod(period, locale).toLowerCase(),
                date: new Date(date).toLocaleDateString(locale),
              }
            )
          )
          break
        }

        default: {
          await sendMessage(message, t({ phrase: 'unknown_command', locale }))
        }
      }
    } catch (e) {
      console.info('Error: ', e)
    }
  })
}

startBot()
  .then(() => {
    console.log('Bot is running')
  })
  .catch(console.log)
