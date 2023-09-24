import { AwaitedRequestResponse, SuccessResponse } from '@/types'

import { AppError } from '../error'

export class Assertion {
  private static assert(type: 'client', variable: unknown | undefined, message?: string): asserts variable is string
  private static assert<ResponseBody>(
    type: 'server',
    variable: AwaitedRequestResponse<ResponseBody>
  ): asserts variable is SuccessResponse<ResponseBody>

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

  static client<T extends unknown | undefined>(variable: T, message: string): asserts variable is NonNullable<T> {
    Assertion.assert('client', variable, message)
  }

  static server<T>(variable: AwaitedRequestResponse<T>): asserts variable is SuccessResponse<T> {
    Assertion.assert('server', variable)
  }
}
