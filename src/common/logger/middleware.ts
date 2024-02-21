import { NextFunction, Request, Response } from 'express'

import { Log } from './logger'

export const loggerMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  Log.info('⬅️ ', req.method, req.path, req.body ?? req.query)
  next()
}
