import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AppError, ValidationError } from '../utils/errors';
import ResponseHelper from '../utils/response';
import { config } from '../config';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    
    if (err instanceof ValidationError) {
      errors = err.errors;
    }
  }

  // Log error (critical level for unhandled / non-operational exceptions)
  if (statusCode === 500) {
    logger.error(`[Unhandled Error] ${err.message}\nStack: ${err.stack}`);
  } else {
    logger.warn(`[Operational Error] ${message} - Status: ${statusCode}`);
  }

  const stack = config.NODE_ENV === 'development' ? err.stack : undefined;

  ResponseHelper.error(res, message, statusCode, errors, stack);
};

export default errorHandler;
