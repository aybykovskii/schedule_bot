import TelegramBot, { Message } from 'node-telegram-bot-api'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'

import '@/common/polyfill/polyfill'

import { isUsualDate, isUsualTime } from '@/common/date'
import { RootRouter } from '@/server/server'
import { env } from '@/common/environment'
import { Commands } from '@/types'
import { commands, isCommand } from '@/common/commands'
import { getButtonTextByPeriod, isLessonPeriod } from '@/common/lesson'
import { getDatesInlineKeyboard, getPeriodsInlineKeyboard, getTimeInlineKeyboard } from '@/common/messages'

const Bot = new TelegramBot(env.TG_BOT_TOKEN, { polling: true })

const sendMessage = async (msg: Message, text: string, options?: TelegramBot.SendMessageOptions) => {
  const chatId = msg.chat?.id

  await Bot.sendMessage(chatId, text, options)
}

const trpc = createTRPCProxyClient<RootRouter>({
  links: [httpBatchLink({ url: `http://localhost:${env.SERVER_PORT}/trpc` })],
})

const startBot = async () => {
  await Bot.setMyCommands(Object.values(commands))

  Bot.on('message', async (message) => {
    if (isCommand(Commands.START, message)) {
      await sendMessage(
        message,
        'Привет, это чат-бот для записи на занятия по английскому и итальянскому языку. Внизу ты увидишь список доступных команд:)'
      )
    } else if (isCommand(Commands.APPOINTMENT, message)) {
      if (!message.from) return

      const {
        from: { id: userId, first_name: name, username },
      } = message

      await trpc.lessons.create.query({ name, userId, tg: `@${username}` })

      await sendMessage(message, 'Выберите дату', { reply_markup: { inline_keyboard: getDatesInlineKeyboard() } })
    }
  })

  Bot.on('callback_query', async (query) => {
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

    if (isUsualDate(data)) {
      await trpc.lessons.edit.query({ userId, date: data })

      const busyHours = await trpc.lessons.getBusyHours.query(data)

      await Bot.deleteMessage(chatId, messageIdString)

      await sendMessage(message, 'Выберите время занятия', {
        reply_markup: {
          inline_keyboard: getTimeInlineKeyboard(busyHours),
        },
      })
    } else if (isUsualTime(data)) {
      const time = +data.replace(':00', '')

      await trpc.lessons.edit.query({ userId, time })

      await Bot.deleteMessage(chatId, messageIdString)

      await sendMessage(message, 'Как часто хотите заниматься?', {
        reply_markup: { inline_keyboard: getPeriodsInlineKeyboard() },
      })
    } else if (isLessonPeriod(data)) {
      const lesson = await trpc.lessons.edit.query({ userId, period: data })

      await Bot.deleteMessage(chatId, messageIdString)

      const { name, date, time, period } = lesson

      await sendMessage(
        message,
        `
Name: ${name}
Date: ${new Date(date).toLocaleDateString('ru')}
Time: ${time}:00
Period: ${getButtonTextByPeriod(period)}
        `
      )
    }
  })
}

startBot()
  .then(() => {
    console.log('Bot is running')
  })
  .catch(console.log)
