import { CallbackData } from './callbackData'

export const localeCD = new CallbackData('locale: {locale}')

export const eventDateCD = new CallbackData('eventDate: {date}')

export const eventActionDateCD = new CallbackData('evActionDate: {action}_{id}_{date}')

export const eventHourCD = new CallbackData('eventTime: {hour}')

export const eventPeriodCD = new CallbackData('eventPeriod: {period}')

export const eventIdCD = new CallbackData('eventId: {id}')

export const eventActionCD = new CallbackData('eventAction: {action}_{id}')

export const previousDatesCD = new CallbackData('previousDatesFrom: {date}')

export const nextDatesCD = new CallbackData('nextDatesFrom: {date}')
