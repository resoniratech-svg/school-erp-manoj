const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_V4_REGEX.test(value);
}

export function assertUUID(value: string, fieldName = 'id'): void {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid UUID format for ${fieldName}: ${value}`);
  }
}

export function generatePrefixedId(prefix: string, uuid: string): string {
  return `${prefix}_${uuid.replace(/-/g, '')}`;
}

export function extractUUIDFromPrefixedId(prefixedId: string): string | null {
  const parts = prefixedId.split('_');
  if (parts.length !== 2) return null;

  const rawId = parts[1];
  if (rawId.length !== 32) return null;

  const uuid = `${rawId.slice(0, 8)}-${rawId.slice(8, 12)}-${rawId.slice(12, 16)}-${rawId.slice(16, 20)}-${rawId.slice(20)}`;
  return isValidUUID(uuid) ? uuid : null;
}

export function normalizeUUID(uuid: string): string {
  return uuid.toLowerCase().trim();
}

export function compareUUIDs(uuid1: string, uuid2: string): boolean {
  return normalizeUUID(uuid1) === normalizeUUID(uuid2);
}
