import { createTRPCProxyClient } from '@trpc/client'
import dayjs from 'dayjs'
import { ObjectId } from 'mongoose'
import TelegramBot, { InlineKeyboardButton, Message, SendMessageOptions } from 'node-telegram-bot-api'

import { Assertion } from '@/common/assertion'
import { eventActionCD, eventActionDateCD } from '@/common/callbackData'
import { getCommands } from '@/common/commands'
import { DATE_FORMAT, localizeDate } from '@/common/date'
import { AppError } from '@/common/error'
import { Phrase, t } from '@/common/i18n'
import { inlineKeyboard } from '@/common/keyboard'
import { getUserLocale, Lang } from '@/common/locale'
import { RootRouter } from '@/server/router'
import { Extended } from '@/types'
import { Action, EventDraft, Period } from '@/common/event'

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
    keyboard?: InlineKeyboardButton[][],
  ) => {
    const { userId, locale } = await this.getMessageInfo(msg)

    try {
      return await this.sendMessage(
        userId,
        t({ phrase, locale }, phraseReplaces ?? {}),
        inlineKeyboard ? ({ reply_markup: { inline_keyboard: keyboard } } as SendMessageOptions) : undefined,
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
    { period, updateEventId }: Partial<Pick<EventDraft, 'period' | 'updateEventId'>> = {},
  ) => {
    const { userId } = await this.getMessageInfo(msg)

    await this.trpc.event.deleteOutdated.query()
    await this.trpc.eventDraft.deleteByUserId.query(userId)
    await this.trpc.eventDraft.create.query({ userId, period, updateEventId })
  }

  sendDates = async (
    msg: Message,
    { startFrom, action = 'add', period = 'once', }:
    { startFrom?: string | undefined; action?: 'add' | 'subtract'; period?: Period },
  ) => {
    const { locale } = await this.getMessageInfo(msg)

    await this.send(
      msg,
      'commands.create.message',
      undefined,
      inlineKeyboard.datesWithButtons({ from: startFrom, locale, action, period }),
    )
  }

  handleActions = async (msg: Message, data: string) => {
    const { locale } = await this.getMessageInfo(msg)
    const { action, id } = eventActionCD.get<{ id: ObjectId & string; action: Action }>(data)

    await this.delete(msg)

    const { date: eventDate, period } = await this.trpc.event.getById.query(id)

    let startDate = eventDate

    while (dayjs(startDate).isBefore(dayjs())) {
      startDate = dayjs(startDate).add(7, 'days').format(DATE_FORMAT)
    }

    switch (action) {
      case 'edit': {
        await this.initializeEventDraft(msg, { period, updateEventId: id })

        await this.sendDates(msg, { period })
        break
      }

      case 'cancel': {
        await this.send(
          msg,
          'actions.cancel.message',
          undefined,
          inlineKeyboard.dates({
            from: startDate,
            locale,
            cb: (date) => eventActionDateCD.fill({ id, date, action }),
            step: 7,
            period: 'once',
          }).keyboard,
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

    await this.send(
      msg,
      `actions.${action}.success`,
      { date: localizeDate({ date, locale }), time: `${hour}:00` },
    )
  }
}
