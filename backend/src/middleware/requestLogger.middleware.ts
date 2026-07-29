import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    logger.http(
      `${method} ${originalUrl} ${statusCode} - ${duration}ms - IP: ${ip}`
    );
  });

  next();
};

export default requestLogger;
