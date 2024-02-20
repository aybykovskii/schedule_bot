import { z } from 'zod'

export const MongooseBaseSchema = z.object({
  _id: z.string(),
})
