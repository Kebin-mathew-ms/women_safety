import rateLimit from 'express-rate-limit';
import ResponseHelper from '../utils/response';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window for this foundation setup
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    ResponseHelper.error(
      res,
      'Too many authentication requests from this IP. Please try again after 15 minutes.',
      429
    );
  },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 forgot password requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ResponseHelper.error(
      res,
      'Too many password recovery attempts. Please try again after an hour.',
      429
    );
  },
});
