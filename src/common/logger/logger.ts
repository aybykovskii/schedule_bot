import { NextFunction, Request, Response } from 'express'

import { env } from '../environment'

export const loggerMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (env.MODE === 'development') {
    console.log('⬅️ ', req.method, req.path, req.body ?? req.query)
  }

  next()
}
