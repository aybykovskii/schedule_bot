import { Client } from '@notionhq/client'

export type NotionPageProps = Parameters<Client['pages']['create']>[0]
