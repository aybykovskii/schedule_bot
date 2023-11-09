import { createTRPCProxyClient } from '@trpc/client'
import TelegramBot, { Message } from 'node-telegram-bot-api'
import dayjs from 'dayjs'
import { ObjectId } from 'mongoose'

import { RootRouter } from '@/server/router'
import { Assertion } from '@/common/assertion'
import { Periods, Locales, Actions } from '@/types'
import { getUserLocale } from '@/common/locale'
import { getBotCommands } from '@/common/commands'
import { Phrase, t } from '@/common/i18n'
import { getPeriodButtonText } from '@/common/event'
import { DATE_FORMAT, localizeDate } from '@/common/date'
import { Event } from '@/common/schemas'
import {
  getCreateEventDatesInlineKeyboard,
  getDatesKeyboard,
  getEventActionsInlineKeyboard,
  getEventsInlineKeyboard,
  getLocalesInlineKeyboard,
  getPeriodsInlineKeyboard,
  getTimeInlineKeyboard,
} from '@/common/keyboard'
import {
  eventActionCD,
  eventCreateDateCD,
  eventPeriodCD,
  eventIdCD,
  eventTimeCD,
  localeCD,
  eventActionDateCD,
} from '@/common/callbackData'
import { AppError } from '@/common/error'

type ClientTRPC = ReturnType<typeof createTRPCProxyClient<RootRouter>>

export class Bot extends TelegramBot {
  trpc: ClientTRPC

  constructor(token: string, trpc: ClientTRPC) {
    super(token, { polling: true })

    this.trpc = trpc
  }

  getMessageInfo = async (msg: Message) => {
    const {
      from,
      chat: { id: chatId },
    } = msg

    Assertion.client(from, 'Message must have a sender')

    const userLocale = await this.trpc.locale.get.query(chatId)

    const locale = userLocale ?? getUserLocale(from.language_code)

    return { ...msg, from, userId: chatId, locale }
  }

  send = async (
    msg: Message,
    phrase: Phrase,
    phraseReplaces?: Record<PropertyKey, string | number> | undefined,
    options?: TelegramBot.SendMessageOptions,
  ) => {
    const { userId, locale } = await this.getMessageInfo(msg)

    try {
      return await this.sendMessage(userId, t({ phrase, locale }, phraseReplaces ?? {}), options)
    } catch (error) {
      await this.sendMessage(userId, t({ phrase: 'error', locale }))

      throw new AppError('client', `${error}`)
    }
  }

  delete = async (msg: Message, id?: number) => {
    const { userId } = await this.getMessageInfo(msg)

    await this.deleteMessage(userId, (id ?? msg.message_id).toString())
  }

  changeChatLocale = async (userId: number, lc?: string | Locales) => {
    const locale = getUserLocale(lc)

    await this.setMyCommands(getBotCommands(locale))
    await this.setChatMenuButton({ chat_id: userId, menu_button: { type: 'commands' } })

    return this.trpc.locale.set.query({ userId, locale })
  }

  initiateEvent = async (msg: Message) => {
    const {
      userId,
      chat: { username, first_name: name = '' },
    } = await this.getMessageInfo(msg)

    await this.trpc.event.create.query({ name, userId, tg: `@${username}` })

    await this.sendDates(msg, undefined)
  }

  submitEvent = async (msg: Message, data: string) => {
    const { userId, locale } = await this.getMessageInfo(msg)
    const { period } = eventPeriodCD.get<{ period: Periods }>(data)

    await this.delete(msg)

    const event = await this.trpc.event.update.query({ userId, period })

    const { date, time, datesMessageId, timeMessageId } = event as Required<Event>

    await this.delete(msg, timeMessageId)
    await this.delete(msg, datesMessageId)

    await this.send(msg, 'message.result', {
      time: `${time}:00`,
      period: getPeriodButtonText(period, locale).toLowerCase(),
      date: dayjs(date).toDate().toLocaleDateString(locale),
    })
  }

  setLocale = async (msg: Message, data: string) => {
    const { userId } = await this.getMessageInfo(msg)
    const { locale } = localeCD.get(data)

    await this.delete(msg)

    await this.changeChatLocale(userId, locale)

    await this.send(msg, 'locale.set')
  }

  sendLocales = async (msg: Message) => {
    await this.send(msg, 'commands.change_locale.message', undefined, {
      reply_markup: { inline_keyboard: getLocalesInlineKeyboard() },
    })
  }

  sendDates = async (msg: Message, startFrom: string | undefined) => {
    const { locale } = await this.getMessageInfo(msg)

    await this.send(msg, 'commands.create.message', undefined, {
      reply_markup: { inline_keyboard: getCreateEventDatesInlineKeyboard(startFrom, locale) },
    })
  }

  sendTime = async (msg: Message, data: string) => {
    const { userId } = await this.getMessageInfo(msg)

    await this.delete(msg)

    const { date } = eventCreateDateCD.get(data)

    const busyHours = await this.trpc.event.getDateBusyHours.query(date)

    const { message_id: datesMessageId } = await this.send(msg, 'selected.date', { date })

    await this.send(msg, 'message.time', undefined, {
      reply_markup: {
        inline_keyboard: getTimeInlineKeyboard(busyHours),
      },
    })

    await this.trpc.event.update.query({ userId, date, dayInWeek: dayjs(date).day(), datesMessageId })
  }

  sendPeriods = async (msg: Message, data: string) => {
    const { userId, locale } = await this.getMessageInfo(msg)
    const { time } = eventTimeCD.get(data)

    await this.delete(msg)

    const { date, dayInWeek } = await this.trpc.event.findUnfilled.query({ userId })
    const periods = await this.trpc.event.getTimeStampAvailablePeriods.query({ date, time: +time, dayInWeek })

    const { message_id: timeMessageId } = await this.send(msg, 'selected.time', { time: `${time}:00` })

    await this.send(msg, 'message.period', undefined, {
      reply_markup: { inline_keyboard: getPeriodsInlineKeyboard(locale, periods) },
    })

    await this.trpc.event.update.query({ userId, time: +time, timeMessageId })
  }

  sendUserEvents = async (msg: Message) => {
    const { userId, locale } = await this.getMessageInfo(msg)

    const events = await this.trpc.event.readAll.query({ userId })

    const editableEvents = events.filter(
      ({ period, date }) => period === Periods.Weekly || dayjs(date).isAfter(dayjs()),
    ) as Event[]

    await this.send(msg, 'commands.edit.message', undefined, {
      reply_markup: { inline_keyboard: getEventsInlineKeyboard(editableEvents, locale) },
    })
  }

  sendEventActions = async (msg: Message, data: string) => {
    const { locale } = await this.getMessageInfo(msg)
    const { id } = eventIdCD.get(data)

    await this.delete(msg)

    await this.send(msg, 'message.event_actions', undefined, {
      reply_markup: { inline_keyboard: getEventActionsInlineKeyboard(id, locale) },
    })
  }

  handleActions = async (msg: Message, data: string) => {
    const { locale } = await this.getMessageInfo(msg)
    const { action, id } = eventActionCD.get<{ id: ObjectId & string; action: Actions }>(data)

    await this.delete(msg)

    const { date: eventDate, period } = await this.trpc.event.readById.query(id)

    let startDate = eventDate

    while (dayjs(startDate).isBefore(dayjs())) {
      startDate = dayjs(startDate).add(7, 'days').format(DATE_FORMAT)
    }

    switch (action) {
      case Actions.Cancel: {
        if (period === Periods.Once) {
          await this.trpc.event.delete.query(id)
        } else {
          await this.send(msg, 'actions.cancel.message', undefined, {
            reply_markup: {
              inline_keyboard: getDatesKeyboard(
                startDate,
                locale,
                (date) => eventActionDateCD.fill({ id, date, action }),
                7,
              ),
            },
          })
        }
        break
      }

      default:
        action satisfies never
    }
  }

  sendActionResult = async (msg: Message, data: string) => {
    const { locale } = await this.getMessageInfo(msg)

    await this.delete(msg)

    const { action, id, date } = eventActionDateCD.get<{
      id: ObjectId & string
      date: string
      action: Actions
    }>(data)

    switch (action) {
      case Actions.Cancel: {
        await this.trpc.event.addExceptionDate.query({ _id: id, date })
        break
      }

      default:
        action satisfies never
    }

    await this.send(msg, `actions.${action}.success`, { date: localizeDate(date, locale) })
  }
}
