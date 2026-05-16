import rateLimit from "express-rate-limit";

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_MINUTES * MS_PER_MINUTE;

// Signup and logout (low abuse risk, moderate cap).
const AUTH_GENERAL_MAX_REQUESTS_PER_WINDOW = 20;

// Login only, tighter to slow credential stuffing (~0.7/min avg over 15 min).
const LOGIN_MAX_REQUESTS_PER_WINDOW = 15;

// Token refresh, higher cap; app may refresh on 401 without sharing login bucket.
const REFRESH_MAX_REQUESTS_PER_WINDOW = 60;

const EMAIL_VERIFICATION_MAX_REQUESTS_PER_HOUR = 5;
const PASSWORD_RESET_MAX_REQUESTS_PER_HOUR = 3;
const VERIFICATION_MAX_REQUESTS_PER_WINDOW = 10;
const AUTH_ME_MAX_REQUESTS_PER_MINUTE = 60;
const ACCOUNT_CHANGE_MAX_REQUESTS_PER_HOUR = 10;

export const emailVerificationLimiter = rateLimit({
  windowMs: MS_PER_HOUR,
  max: EMAIL_VERIFICATION_MAX_REQUESTS_PER_HOUR,
  message: {
    error: "Too many verification email requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordResetLimiter = rateLimit({
  windowMs: MS_PER_HOUR,
  max: PASSWORD_RESET_MAX_REQUESTS_PER_HOUR,
  message: {
    error: "Too many password reset requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Signup and logout only.
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: AUTH_GENERAL_MAX_REQUESTS_PER_WINDOW,
  message: {
    error: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: LOGIN_MAX_REQUESTS_PER_WINDOW,
  message: {
    error: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: REFRESH_MAX_REQUESTS_PER_WINDOW,
  message: {
    error: "Too many token refresh requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const verificationLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: VERIFICATION_MAX_REQUESTS_PER_WINDOW,
  message: {
    error: "Too many verification attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authMeLimiter = rateLimit({
  windowMs: MS_PER_MINUTE,
  max: AUTH_ME_MAX_REQUESTS_PER_MINUTE,
  message: {
    error: "Too many authentication checks. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const accountChangeLimiter = rateLimit({
  windowMs: MS_PER_HOUR,
  max: ACCOUNT_CHANGE_MAX_REQUESTS_PER_HOUR,
  message: {
    error: "Too many account change requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
