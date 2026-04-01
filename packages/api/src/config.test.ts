import { describe, expect, it } from 'vitest';
import {
  coerceBooleanEnvValue,
  coerceOptionalPositiveIntEnvValue,
} from './config.js';

describe('config coercion helpers', () => {
  it('coerces common boolean env values', () => {
    expect(coerceBooleanEnvValue('true')).toBe(true);
    expect(coerceBooleanEnvValue('FALSE')).toBe(false);
    expect(coerceBooleanEnvValue('1')).toBe(true);
    expect(coerceBooleanEnvValue('0')).toBe(false);
  });

  it('treats blank values as undefined for optional env values', () => {
    expect(coerceBooleanEnvValue('')).toBeUndefined();
    expect(coerceOptionalPositiveIntEnvValue('')).toBeUndefined();
    expect(coerceOptionalPositiveIntEnvValue('  ')).toBeUndefined();
  });

  it('converts numeric strings into numbers', () => {
    expect(coerceOptionalPositiveIntEnvValue('42')).toBe(42);
  });
});
