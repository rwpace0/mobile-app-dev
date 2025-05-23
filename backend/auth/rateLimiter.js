import rateLimit from 'express-rate-limit';

// Create a limiter for email verification resend
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many verification email requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a limiter for general auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a limiter specifically for verification endpoints
export const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many verification attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a limiter specifically for /auth/me endpoint
export const authMeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 60, // limit each IP to 60 requests per minute
  message: {
    error: 'Too many authentication checks. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
}); 