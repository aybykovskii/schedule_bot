import { z } from 'zod'

/**
 * @description Date (D|DD).(M|MM).YYYY or (M|MM).(D|DD).YYYY format
 */
export const usualDate = z.string().regex(/\d{1,2}\.\d{1,2}\.\d{4}/)

/**
 * @description Time (H|HH).MM format
 */
export const usualTime = z.string().regex(/\d{1,2}/)
