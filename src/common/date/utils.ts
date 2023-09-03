import { usualDate, usualTime } from './schemas'

export const formatDate = (date: Date | number | string) => {
  const expectedDate = typeof date === 'string' ? new Date(date) : date

  return Intl.DateTimeFormat('ru', { month: 'long', day: 'numeric' }).format(expectedDate)
}

export const isUsualDate = (date: string) => usualDate.safeParse(date).success

export const getTimeHours = (date: string) => date.replace(/(\d{2}):\d{2}:\d{2}/, '$1')

export const isUsualTime = (time: string) => usualTime.safeParse(time).success
