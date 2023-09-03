import TelegramBot, { Message } from 'node-telegram-bot-api'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'

import '@/common/polyfill/polyfill'

import { formatDate, isUsualDate, isUsualTime } from '@/common/date'
import { RootRouter } from '@/server/server'
import { env } from '@/common/environment'
import { Commands, LessonPeriod } from '@/types'
import { commands, isCommand } from '@/common/commands'
import { getButtonTextByPeriod, isLessonPeriod } from '@/common/lesson'

const Bot = new TelegramBot(env.TG_BOT_TOKEN, { polling: true })

const sendMessage = async (msg: Message, text: string, options?: TelegramBot.SendMessageOptions) => {
  const chatId = msg.chat?.id

  await Bot.sendMessage(chatId, text, options)
}

const trpc = createTRPCProxyClient<RootRouter>({
  links: [httpBatchLink({ url: `http://localhost:${env.SERVER_PORT}/trpc` })],
})

type Appointment = {
  userId: number
  date?: string
  time?: string
  name?: string
  period?: LessonPeriod
}

class AppointmentData {
  static appointments: Appointment[] = []

  static edit = ({ userId, ...data }: Appointment) => {
    const appointment = AppointmentData.appointments.find((app) => app.userId === userId)

    if (!appointment) {
      AppointmentData.appointments.push({ userId, ...data })
    } else {
      AppointmentData.appointments = AppointmentData.appointments.map((app) => {
        if (app !== appointment) return app

        return {
          ...app,
          ...data,
        }
      })
    }
  }

  static get = (userId: Appointment['userId']) => {
    const appointment = AppointmentData.appointments.find((app) => app.userId === userId)

    if (!appointment) {
      throw Error(`Appointment for user ${userId} is undefined`)
    }

    return appointment as Required<Appointment>
  }
}

const startBot = async () => {
  await Bot.setMyCommands(Object.values(commands))

  Bot.on('message', async (msg) => {
    if (isCommand(Commands.START, msg)) {
      await sendMessage(
        msg,
        'Привет, это чат-бот для записи на занятия по английскому и итальянскому языку. Внизу ты увидишь список доступных команд:)'
      )
    } else if (isCommand(Commands.APPOINTMENT, msg)) {
      const today = new Date().getDate()
      const month = new Date().getMonth() + 1
      const year = new Date().getFullYear()

      const dates = new Array(7)
        .fill(0)
        .map((_, i) => today + i)
        .map((day) => [
          {
            callback_data: `${month}.${day}.${year}`,
            text: `📅 ${formatDate(`${month}.${day}.${year}`)}`,
          },
        ])

      await sendMessage(msg, 'Выберите дату', {
        reply_markup: {
          inline_keyboard: dates,
        },
      })
    }
  })

  Bot.on('callback_query', async (query) => {
    try {
      const userId = query.from.id
      const text = query.data

      if (!text) return
      console.log({ userId, text })

      if (isUsualDate(text)) {
        AppointmentData.edit({ userId, date: text })

        const lessons = await trpc.lessons.getForDay.query(text)

        const availableHours = new Array(+env.END_HOUR - +env.START_HOUR)
          .fill(0)
          .map((_, i) => +env.START_HOUR + i)
          .filter((hour) => !lessons.includes(hour))

        if (!query.message) return
        console.log(query)
        await Bot.deleteMessage(query.message.chat.id, query.message.message_id.toString())

        await sendMessage(query.message, 'Выберите время занятия', {
          reply_markup: {
            inline_keyboard: availableHours.map((hour) => [
              {
                callback_data: `${hour}:00`,
                text: `🕘 ${hour}:00`,
              },
            ]),
          },
        })
      } else if (isUsualTime(text)) {
        AppointmentData.edit({ userId, time: text })

        console.log(AppointmentData.appointments)

        if (!query.message) return

        await Bot.deleteMessage(query.message.chat.id, query.message.message_id.toString())

        const periods = Object.values(LessonPeriod).map((period) => [
          {
            callback_data: period,
            text: getButtonTextByPeriod(period),
          },
        ])

        await sendMessage(query.message, 'Как часто хотите заниматься?', { reply_markup: { inline_keyboard: periods } })
      } else if (isLessonPeriod(text)) {
        AppointmentData.edit({
          userId,
          period: text,
          name: `@${query.message?.chat.username} - ${query.message?.chat.first_name}`,
        })

        if (!query.message) return
        await Bot.deleteMessage(query.message.chat.id, query.message.message_id.toString())

        const { name, date, time, period } = AppointmentData.get(userId)

        await sendMessage(
          query.message,
          `
Name: ${name}
Date: ${date}
Time: ${time}
Period: ${getButtonTextByPeriod(period)}
        `
        )

        await trpc.lessons.create.query({ title: name, date: { start: `${date} ${time}` }, period })
      }
    } catch (error) {
      console.log(error)
    }
  })
}

startBot().then(console.log.bind(null, 'Bot started')).catch(console.log)
