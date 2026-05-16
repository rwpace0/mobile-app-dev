// Exercise/media rate limiters are defined below but not wired on routes (see routes/exercises.js, routes/media.js).
import rateLimit from "express-rate-limit";

const MS_PER_MINUTE = 60 * 1000;const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_MINUTES * MS_PER_MINUTE;

// High cap for /exercises (list, sync, CRUD). Keyed by JWT sub or IP for public GETs.
// 33/min
const EXERCISES_MAX_REQUESTS_PER_WINDOW = 500;

// Higher cap for /media (image/video proxy during initial sync and download queue).
// 53/min
const MEDIA_MAX_REQUESTS_PER_WINDOW = 800;

/**
 * Derive a rate-limit bucket from JWT sub (no signature verify) or IP.
 */
export function getRateLimitKey(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
      );
      if (payload.sub) return payload.sub;
    } catch {
      // fall through to IP
    }
  }
  return req.ip;
}

function createPerUserLimiter({
  max,
  message,
  keyGenerator = getRateLimitKey,
}) {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
  });
}

// Not in use — re-enable via router.use(exerciseLimiter) in routes/exercises.js.
// 500 requests per 15 minutes per user (or per IP when unauthenticated).
export const exerciseLimiter = createPerUserLimiter({
  max: EXERCISES_MAX_REQUESTS_PER_WINDOW,
  message: "Too many exercise requests. Please try again later.",
});

// Not in use — re-enable via router.use(mediaLimiter) in routes/media.js (after verifyToken).
// 800 requests per 15 minutes per authenticated user (runs after verifyToken).
export const mediaLimiter = createPerUserLimiter({
  max: MEDIA_MAX_REQUESTS_PER_WINDOW,
  message: "Too many media requests. Please try again later.",
  keyGenerator: (req) => req.user?.id ?? getRateLimitKey(req),
});
