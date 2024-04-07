import { createTRPCProxyClient } from '@trpc/client'
import dayjs from 'dayjs'
import { ObjectId } from 'mongoose'
import TelegramBot, {
  InlineKeyboardButton,
  Message,
  SendMessageOptions,
} from 'node-telegram-bot-api'

import { Assertion } from '@/common/assertion'
import { eventActionCD, eventActionDateCD, eventDateCD } from '@/common/callbackData'
import { getCommands } from '@/common/commands'
import { Dates } from '@/common/date'
import { AppError } from '@/common/error'
import { Action, EventDraft } from '@/common/event'
import { Phrase, t } from '@/common/i18n'
import { DatesArgs, inlineKeyboard } from '@/common/keyboard'
import { Lang, getUserLocale } from '@/common/locale'
import { RootRouter } from '@/server/router'
import { Extended } from '@/types'
import { env } from '@/common/environment'

type ClientTRPC = ReturnType<typeof createTRPCProxyClient<RootRouter>>

export class Bot extends TelegramBot {
  trpc: ClientTRPC

  constructor(token: string, trpc: ClientTRPC) {
    super(token, { polling: true })

    this.trpc = trpc
  }

  getMessageInfo = async <T extends string = string>(msg: Message) => {
    const {
      text,
      from,
      chat: { id: chatId },
    } = msg

    Assertion.client(from, 'Message must have a sender')

    const userLocale = await this.trpc.locale.get.query(chatId)

    const locale = userLocale ?? getUserLocale(from.language_code)

    return { ...msg, from, userId: chatId, locale, text: text as Extended<T> }
  }

  send = async (
    msg: Message,
    phrase: Phrase,
    phraseReplaces?: Record<PropertyKey, string | number> | undefined,
    keyboard?: InlineKeyboardButton[][]
  ) => {
    const { userId, locale } = await this.getMessageInfo(msg)

    try {
      return await this.sendMessage(
        userId,
        t({ phrase, locale }, phraseReplaces ?? {}),
        inlineKeyboard
          ? ({ reply_markup: { inline_keyboard: keyboard } } as SendMessageOptions)
          : undefined
      )
    } catch (error) {
      await this.sendMessage(userId, t({ phrase: 'error', locale }))

      throw new AppError('client', `${error}`)
    }
  }

  delete = async (msg: Message, id?: number) => {
    const { userId } = await this.getMessageInfo(msg)

    await this.deleteMessage(userId, (id ?? msg.message_id).toString())
  }

  changeChatLocale = async (userId: number, lc?: Extended<Lang>) => {
    const locale = getUserLocale(lc)

    await this.setMyCommands(getCommands(locale))
    await this.setChatMenuButton({ chat_id: userId, menu_button: { type: 'commands' } })

    return this.trpc.locale.set.query({ userId, locale })
  }

  initializeEventDraft = async (
    msg: Message,
    { period, updateEventId }: Partial<Pick<EventDraft, 'period' | 'updateEventId'>> = {}
  ) => {
    const { userId } = await this.getMessageInfo(msg)

    await this.trpc.event.deleteOutdated.query()
    await this.trpc.eventDraft.deleteByUserId.query(userId)
    await this.trpc.eventDraft.create.query({ userId, period, updateEventId })
  }

  sendDates = async (
    msg: Message,
    { start, period = 'once' }: Pick<DatesArgs, 'start' | 'period'>
  ) => {
    const { locale } = await this.getMessageInfo(msg)

    await this.send(
      msg,
      'commands.create.message',
      undefined,
      inlineKeyboard.dates({
        start,
        locale,
        period,
        cb: (date) => eventDateCD.fill({ date }),
        withControls: period === 'once',
        exceptions: env.DAY_OFF,
      })
    )
  }

  handleActions = async (msg: Message, data: string) => {
    const { locale } = await this.getMessageInfo(msg)
    const { action, id } = eventActionCD.get<{ id: ObjectId & string; action: Action }>(data)

    await this.delete(msg)

    const { date: eventDate, period } = await this.trpc.event.getById.query(id)

    let startDate = dayjs(eventDate)

    while (startDate.isBefore(dayjs())) {
      startDate = startDate.add(7, 'days')
    }

    switch (action) {
      case 'edit': {
        await this.initializeEventDraft(msg, { period, updateEventId: id })

        await this.sendDates(msg, { period, start: dayjs() })
        break
      }

      case 'cancel': {
        await this.send(
          msg,
          'actions.cancel.message',
          undefined,
          inlineKeyboard.dates({
            start: startDate,
            locale,
            cb: (date) => eventActionDateCD.fill({ id, date, action }),
            step: 7,
            period: 'once',
          })
        )
        break
      }

      case 'delete': {
        await this.trpc.event.delete.query(id)
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
      id: string
      date: string
      action: Action
    }>(data)

    const { hour } = await this.trpc.event.getById.query(id)

    switch (action) {
      case 'cancel': {
        await this.trpc.event.addExceptionDate.query({ _id: id, date })
        break
      }

      case 'delete': {
        await this.trpc.event.delete.query(id)
        break
      }

      case 'edit': {
        break
      }

      default:
        action satisfies never
    }

    await this.send(msg, `actions.${action}.success`, {
      date: Dates.localize({ date, locale }),
      time: `${hour}:00`,
    })
  }
}
