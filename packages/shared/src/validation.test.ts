import { describe, expect, it } from 'vitest';
import {
  isValidHiveUsername,
  isValidOperationId,
  normalizeOperationId,
  parseStringList,
  sanitizeOperationPrefix,
} from './index.js';

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

  it('accepts valid operation ids', () => {
    expect(isValidOperationId('honeycomb_app_action')).toBe(true);
    expect(isValidOperationId('starter2_vote')).toBe(true);
  });

  it('rejects invalid operation ids', () => {
    expect(isValidOperationId('Honeycomb App Action')).toBe(false);
    expect(isValidOperationId('_hidden')).toBe(false);
    expect(isValidOperationId('bad-id')).toBe(false);
  });

  it('normalizes operation ids', () => {
    expect(normalizeOperationId(' HoneyComb_App_Action ')).toBe('honeycomb_app_action');
  });

  it('parses comma-delimited lists', () => {
    expect(parseStringList('a, b, ,c')).toEqual(['a', 'b', 'c']);
  });
});
