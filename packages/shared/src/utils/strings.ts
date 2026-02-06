export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function capitalizeWords(str: string): string {
  return str.split(' ').map(capitalize).join(' ');
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

export function isNullOrEmpty(str: string | null | undefined): boolean {
  return str === null || str === undefined || str.trim() === '';
}

export function isNotNullOrEmpty(str: string | null | undefined): str is string {
  return !isNullOrEmpty(str);
}

export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

export function removeSpecialChars(str: string): string {
  return str.replace(/[^a-zA-Z0-9\s]/g, '');
}

export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, char => htmlEntities[char]);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;

  const visibleChars = Math.min(3, Math.floor(local.length / 2));
  const maskedLocal = local.slice(0, visibleChars) + '***';

  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;

  return digits.slice(0, -4).replace(/./g, '*') + digits.slice(-4);
}

export function formatName(firstName: string, lastName: string, format: 'full' | 'first_last' | 'last_first' = 'full'): string {
  const first = capitalize(firstName.trim());
  const last = capitalize(lastName.trim());

  switch (format) {
    case 'last_first':
      return `${last}, ${first}`;
    case 'first_last':
    case 'full':
    default:
      return `${first} ${last}`;
  }
}

export function generateInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}

export function generateSlug(str: string, maxLength = 50): string {
  return truncate(slugify(str), maxLength, '');
}
