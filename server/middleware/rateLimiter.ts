import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Custom key generator - uses user ID if authenticated, otherwise IP
const keyGenerator = (req: Request): string => {
  // If user is authenticated, use their ID for rate limiting
  const userId = (req as any).user?.userId;
  if (userId) {
    return `user:${userId}`;
  }
  // Otherwise use IP address
  return req.ip || req.socket.remoteAddress || 'unknown';
};

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// ==================== RATE LIMITERS ====================

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * Strict rate limiter for auth routes (login/register)
 * Prevents brute force attacks
 * 5 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: rateLimitHandler,
});

/**
 * Account creation limiter
 * 3 accounts per hour per IP
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations
  message: {
    success: false,
    error: 'Too many accounts created',
    message: 'Too many accounts created from this IP. Please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * API intensive operations (AI generation, imports)
 * 20 requests per 10 minutes
 */
export const intensiveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: {
    success: false,
    error: 'Rate limit exceeded for intensive operations',
    message: 'You have made too many requests. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * Webhook receiver - more permissive for external services
 * 1000 requests per minute (Shopify can send bursts)
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: { success: false, error: 'Webhook rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
  // Use shop domain for Shopify webhooks
  keyGenerator: (req: Request) => {
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    return shopDomain || req.ip || 'unknown';
  },
});

/**
 * Search/listing endpoints
 * 30 requests per minute
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: 'Search rate limit exceeded',
    message: 'Too many search requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * Slow down middleware for suspicious activity
 * Adds delay after too many requests
 */
export const slowDown = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Start slowing after 50 requests
  message: { success: false, error: 'Please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export default {
  general: generalLimiter,
  auth: authLimiter,
  registration: registrationLimiter,
  intensive: intensiveLimiter,
  webhook: webhookLimiter,
  search: searchLimiter,
  slowDown,
};
