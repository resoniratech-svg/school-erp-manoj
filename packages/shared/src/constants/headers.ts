export const HTTP_HEADERS = {
  REQUEST_ID: 'x-request-id',
  CORRELATION_ID: 'x-correlation-id',
  TENANT_ID: 'x-tenant-id',
  BRANCH_ID: 'x-branch-id',
  USER_ID: 'x-user-id',
  CLIENT_VERSION: 'x-client-version',
  API_VERSION: 'x-api-version',

  AUTHORIZATION: 'authorization',
  CONTENT_TYPE: 'content-type',
  ACCEPT: 'accept',
  ACCEPT_LANGUAGE: 'accept-language',
  USER_AGENT: 'user-agent',
  ORIGIN: 'origin',
  REFERER: 'referer',

  RATE_LIMIT_LIMIT: 'x-ratelimit-limit',
  RATE_LIMIT_REMAINING: 'x-ratelimit-remaining',
  RATE_LIMIT_RESET: 'x-ratelimit-reset',
  RETRY_AFTER: 'retry-after',

  CACHE_CONTROL: 'cache-control',
  ETAG: 'etag',
  IF_NONE_MATCH: 'if-none-match',
  IF_MODIFIED_SINCE: 'if-modified-since',
  LAST_MODIFIED: 'last-modified',
} as const;

export type HttpHeader = (typeof HTTP_HEADERS)[keyof typeof HTTP_HEADERS];

export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  MULTIPART_FORM: 'multipart/form-data',
  TEXT_PLAIN: 'text/plain',
  TEXT_HTML: 'text/html',
  TEXT_CSV: 'text/csv',
  APPLICATION_PDF: 'application/pdf',
  APPLICATION_XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

export const AUTH_SCHEMES = {
  BEARER: 'Bearer',
  BASIC: 'Basic',
  API_KEY: 'ApiKey',
} as const;

export type AuthScheme = (typeof AUTH_SCHEMES)[keyof typeof AUTH_SCHEMES];

export function parseAuthorizationHeader(
  header: string | undefined
): { scheme: string; credentials: string } | null {
  if (!header) return null;

  const [scheme, credentials] = header.split(' ');
  if (!scheme || !credentials) return null;

  return { scheme, credentials };
}

export function createBearerToken(token: string): string {
  return `${AUTH_SCHEMES.BEARER} ${token}`;
}

export function extractBearerToken(header: string | undefined): string | null {
  const parsed = parseAuthorizationHeader(header);
  if (!parsed || parsed.scheme !== AUTH_SCHEMES.BEARER) return null;
  return parsed.credentials;
}
