import { z } from 'zod'

export const UsualDate = z.string().regex(/^\d{1,2}\.\d{1,2}\.\d{4}$/)
