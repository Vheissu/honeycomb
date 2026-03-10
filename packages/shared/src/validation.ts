const HIVE_USERNAME_PATTERN = /^[a-z][a-z0-9.-]{2,15}$/;

export function isValidHiveUsername(value: string): boolean {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!HIVE_USERNAME_PATTERN.test(normalized)) {
    return false;
  }

  if (normalized.includes('..') || normalized.startsWith('.') || normalized.endsWith('.')) {
    return false;
  }

  return true;
}

export function sanitizeOperationPrefix(prefix: string): string {
  const normalized = String(prefix ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || 'honeycomb';
}

export function parseStringList(value: string): string[] {
  return String(value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}
