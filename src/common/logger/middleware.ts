import { NextFunction, Request, Response } from 'express'

import { env } from '../environment'

import { Log } from './logger'

export const loggerMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (env.MODE === 'development') {
    Log.info('⬅️ ', req.method, req.path, req.body ?? req.query)
  }

  next()
}
