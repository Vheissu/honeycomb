import { describe, expect, it } from 'vitest';
import { isValidHiveUsername, parseStringList, sanitizeOperationPrefix } from './index.js';

describe('validation helpers', () => {
  it('accepts valid hive usernames', () => {
    expect(isValidHiveUsername('beggars')).toBe(true);
    expect(isValidHiveUsername('peak.snaps')).toBe(true);
  });

  it('rejects invalid hive usernames', () => {
    expect(isValidHiveUsername('A')).toBe(false);
    expect(isValidHiveUsername('bad..name')).toBe(false);
    expect(isValidHiveUsername('.badname')).toBe(false);
  });

  it('sanitizes operation prefixes', () => {
    expect(sanitizeOperationPrefix('Honeycomb Starter')).toBe('honeycomb_starter');
  });

  it('parses comma-delimited lists', () => {
    expect(parseStringList('a, b, ,c')).toEqual(['a', 'b', 'c']);
  });
});
