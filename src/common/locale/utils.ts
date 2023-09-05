import { Locales } from '@/types'

export const isLocale = (string: string): string is Locales => Object.values(Locales).includes(string as Locales)

export const getUserLocale = (lc?: string): Locales => (!lc || !isLocale(lc) ? Locales.En : lc)
