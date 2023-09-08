import { Locales } from '@/types'

import { usualDate, usualTime } from './schemas'

export const formatDate = (date: Date | number | string, locale: Locales) => {
  const expectedDate = typeof date === 'string' ? new Date(date) : date

  return Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(expectedDate)
}

export const isUsualDate = (date: string) => usualDate.safeParse(date).success

export const getTimeHours = (date: string) => date.replace(/(\d{2}):\d{2}:\d{2}/, '$1')

export const isUsualTime = (time: string) => usualTime.safeParse(time).success

export const getIcsDate = (date: string, time: number): [number, number, number, number, number] => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()

  return [year, month, day, time, 0]
}

export const getJSONDate = (date: string, time: number) => new Date(`${date} ${time}:00`).toJSON()
