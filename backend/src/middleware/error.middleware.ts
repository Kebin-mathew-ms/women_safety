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
  let errors: any = null;

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

  const errorData = {
    ...(errors && { errors }),
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  };

  ResponseHelper.error(res, message, statusCode, Object.keys(errorData).length > 0 ? errorData : undefined);
};

export default errorHandler;
