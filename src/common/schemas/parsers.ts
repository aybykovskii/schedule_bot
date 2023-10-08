import { Locales } from '@/types'

import { LocalesEnum } from './locale'

export const isLocale = (string: string): string is Locales => LocalesEnum.safeParse(string).success
