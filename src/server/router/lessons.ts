import { initTRPC } from '@trpc/server'

import { LessonModel } from '@/server/models'
import { usualDate } from '@/common/date'
import { Lesson, isLessonFilled, lessonSchema } from '@/common/lesson'
import { notionLessons } from '@/server/notion'
import { env } from '@/common/environment'

import { googleCalendar } from '../google'

const t = initTRPC.create()
const { procedure } = t

export const TRPCLessonsRouter = t.router({
  create: procedure.input(lessonSchema.deepPartial()).query(async ({ input }) => {
    const lesson = await LessonModel.findOne({
      userId: input.userId,
      isFilled: false,
    })

    if (lesson) return lesson

    const newLesson = await LessonModel.create({
      ...input,
      isFilled: isLessonFilled(input),
    })

    return newLesson
  }),

  update: procedure.input(lessonSchema.deepPartial()).query(async ({ input }) => {
    const { date, time, period, userId } = input

    const lesson = await LessonModel.findOne({ userId, isFilled: false })

    if (!lesson) {
      throw Error('Edited lesson is undefined')
    }

    const isFilled = isLessonFilled({ ...lesson.toObject(), ...input })

    const updatedLesson = await LessonModel.findOneAndUpdate(
      { _id: lesson._id },
      {
        ...(date ? { date } : {}),
        ...(time ? { time } : {}),
        ...(period ? { period } : {}),
        isFilled,
      },
      {
        new: true,
      }
    )

    if (isFilled) {
      await googleCalendar.createEvent(updatedLesson?.toObject() as Lesson)

      if (env.USE_NOTION) {
        await notionLessons.create(updatedLesson?.toObject() as Lesson)
      }
    }

    return updatedLesson as Lesson
  }),

  getBusyHours: procedure.input(usualDate).query(async ({ input }) => {
    const lessons = await LessonModel.find({ date: input })

    return lessons.map((lesson) => lesson.toObject().time)
  }),
})
