import { z } from 'zod'

/**
 * @description Дата вида (D|DD).(M|MM).YYYY или (M|MM).(D|DD).YYYY
 */
export const usualDate = z.string().regex(/\d{1,2}\.\d{1,2}\.\d{4}/)

/**
 * @description Время вида (H|HH).MM
 */
export const usualTime = z.string().regex(/\d{1,2}:\d{2}/)
