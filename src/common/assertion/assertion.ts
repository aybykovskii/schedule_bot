import { Response, SucceedResponse } from '@/types'

import { AppError } from '../error'

export class Assertion {
  private static assert(type: 'client', variable: unknown, message?: string): asserts variable is string
  private static assert<ResponseBody>(
    type: 'server',
    variable: Response<ResponseBody>
  ): asserts variable is SucceedResponse<ResponseBody>

  private static assert(type: 'client' | 'server', variable: unknown, message?: string) {
    if (type === 'client') {
      if (!variable) {
        throw new AppError(type, message ?? `${variable} is not defined`)
      }
    } else if (
      variable &&
      typeof variable === 'object' &&
      'success' in variable &&
      !variable.success &&
      'error' in variable
    ) {
      throw new AppError(type, message ?? `Request failed: ${variable.error}`)
    }
  }

  static simple<T>(variable: T): asserts variable is NonNullable<T> {
    Assertion.assert('client', variable)
  }

  static client<T>(variable: T, message: string): asserts variable is NonNullable<T> {
    Assertion.assert('client', variable, message)
  }

  static server<T>(variable: Response<T>): asserts variable is SucceedResponse<T> {
    Assertion.assert('server', variable)
  }
}
