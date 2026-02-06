export const MILLISECONDS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

export const SECONDS = {
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
  WEEK: 7 * 24 * 60 * 60,
} as const;

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * MILLISECONDS.MINUTE,
  REFRESH_TOKEN: 7 * MILLISECONDS.DAY,
  PASSWORD_RESET: 1 * MILLISECONDS.HOUR,
  EMAIL_VERIFICATION: 24 * MILLISECONDS.HOUR,
  API_KEY: 365 * MILLISECONDS.DAY,
  SESSION: 30 * MILLISECONDS.DAY,
} as const;

export const CACHE_TTL = {
  SHORT: 5 * MILLISECONDS.MINUTE,
  MEDIUM: 30 * MILLISECONDS.MINUTE,
  LONG: 1 * MILLISECONDS.HOUR,
  VERY_LONG: 24 * MILLISECONDS.HOUR,
} as const;

export const RATE_LIMIT = {
  DEFAULT_WINDOW_MS: 15 * MILLISECONDS.MINUTE,
  DEFAULT_MAX_REQUESTS: 100,
  AUTH_WINDOW_MS: 15 * MILLISECONDS.MINUTE,
  AUTH_MAX_REQUESTS: 5,
  API_WINDOW_MS: 1 * MILLISECONDS.MINUTE,
  API_MAX_REQUESTS: 60,
} as const;

export const TIMEOUT = {
  REQUEST: 30 * MILLISECONDS.SECOND,
  DATABASE: 10 * MILLISECONDS.SECOND,
  EXTERNAL_SERVICE: 15 * MILLISECONDS.SECOND,
  FILE_UPLOAD: 5 * MILLISECONDS.MINUTE,
  SHUTDOWN_GRACE: 30 * MILLISECONDS.SECOND,
} as const;

export function toMilliseconds(seconds: number): number {
  return seconds * MILLISECONDS.SECOND;
}

export function toSeconds(milliseconds: number): number {
  return Math.floor(milliseconds / MILLISECONDS.SECOND);
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < MILLISECONDS.SECOND) {
    return `${milliseconds}ms`;
  }
  if (milliseconds < MILLISECONDS.MINUTE) {
    return `${toSeconds(milliseconds)}s`;
  }
  if (milliseconds < MILLISECONDS.HOUR) {
    const minutes = Math.floor(milliseconds / MILLISECONDS.MINUTE);
    const seconds = toSeconds(milliseconds % MILLISECONDS.MINUTE);
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  if (milliseconds < MILLISECONDS.DAY) {
    const hours = Math.floor(milliseconds / MILLISECONDS.HOUR);
    const minutes = Math.floor((milliseconds % MILLISECONDS.HOUR) / MILLISECONDS.MINUTE);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  const days = Math.floor(milliseconds / MILLISECONDS.DAY);
  const hours = Math.floor((milliseconds % MILLISECONDS.DAY) / MILLISECONDS.HOUR);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

export function getExpirationDate(ttlMs: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + ttlMs);
}

export function isExpiredByTTL(createdAt: Date, ttlMs: number): boolean {
  return Date.now() > createdAt.getTime() + ttlMs;
}
