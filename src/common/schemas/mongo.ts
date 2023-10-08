import { ObjectId } from 'mongoose'
import { z } from 'zod'

export const ObjectIdSchema = z.custom<ObjectId>()

export const MongoModelSchema = z.object({
  _id: ObjectIdSchema.optional(),
  __v: z.number().optional(),
})
