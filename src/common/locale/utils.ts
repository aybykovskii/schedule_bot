import { Locales } from '@/types'

import { isLocale } from '../schemas'

export const getUserLocale = (lc?: string): Locales => (!lc || !isLocale(lc) ? Locales.En : lc)
