import { Client } from '@notionhq/client'

import { env } from '@/common/environment'
import { asNotionPage, Lesson } from '@/common/lesson'

class NotionLessons {
  private client: Client

  constructor() {
    this.client = new Client({
      auth: env.NOTION_TOKEN,
    })
  }

  create = async (lesson: Lesson) => this.client.pages.create(asNotionPage(lesson))
}

export const notionLessons = new NotionLessons()
