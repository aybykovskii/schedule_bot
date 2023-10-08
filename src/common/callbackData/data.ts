import { CallbackData } from './callbackData'

export const localeCD = new CallbackData('locale: {locale}')

export const eventCreateDateCD = new CallbackData('eventCreateDate: {date}')

export const eventActionDateCD = new CallbackData('eventActionDate: {action}_{id}_{date}')

export const eventTimeCD = new CallbackData('eventTime: {time}')

export const eventPeriodCD = new CallbackData('eventPeriod: {period}')

export const eventIdCD = new CallbackData('eventId: {id}')

export const eventActionCD = new CallbackData('eventAction: {action}_{id}')

export const previousDatesCD = new CallbackData('previousDatesFrom: {date}')

export const nextDatesCD = new CallbackData('nextDatesFrom: {date}')
