import { describe, expect, it } from 'vitest';
import { formatHivesignerOAuthError, parseFragment } from './auth-callback';

describe('auth callback helpers', () => {
  it('parses URL fragments', () => {
    const params = parseFragment('#access_token=abc&username=tester');
    expect(params.get('access_token')).toBe('abc');
    expect(params.get('username')).toBe('tester');
  });

  it('formats unauthorized_client errors clearly', () => {
    expect(formatHivesignerOAuthError('unauthorized_client')).toContain('Configure the client account as an app');
  });
});
