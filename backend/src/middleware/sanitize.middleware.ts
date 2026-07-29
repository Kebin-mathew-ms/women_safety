import { Request, Response, NextFunction } from 'express';

const sanitizeValue = (val: unknown): any => {
  if (typeof val === 'string') {
    // Basic stripping of script tags and other potentially hazardous HTML to prevent XSS
    return val
      .replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val !== null && typeof val === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(val)) {
      sanitizedObj[key] = sanitizeValue(value);
    }
    return sanitizedObj;
  }
  return val;
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
};

export default sanitizeInput;
