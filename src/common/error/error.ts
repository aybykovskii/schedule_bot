import { Log } from '../logger'

export class AppError extends Error {
  constructor(type: 'client' | 'server', message: string) {
    super(message)

    Log.error(`Error on ${type} side:\n ${message}`)
  }
}
