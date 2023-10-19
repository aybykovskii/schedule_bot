import { Log } from '../logger'

export class AppError extends Error {
  constructor(type: 'client' | 'server', message: string) {
    const text = `Error on ${type} side:\n ${message}`

    super(text)

    Log.error(text)
  }
}
