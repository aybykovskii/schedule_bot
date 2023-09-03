import { NextFunction, Request, Response } from 'express'

export const loggerMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  console.log('⬅️ ', req.method, req.path, req.body ?? req.query)

  next()
}
