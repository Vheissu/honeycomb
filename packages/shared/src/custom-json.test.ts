import { describe, expect, it } from 'vitest';
import {
  buildPostingCustomJson,
  createExampleActionPayload,
  createOperationId,
  parseCustomJsonEnvelope,
} from './index.js';

describe('custom_json helpers', () => {
  it('builds posting custom_json envelopes', () => {
    const operation = buildPostingCustomJson({
      username: 'alice',
      operationId: 'honeycomb_app_action',
      payload: createExampleActionPayload('Hello Hive'),
    });

    expect(operation.required_auths).toEqual([]);
    expect(operation.required_posting_auths).toEqual(['alice']);
    expect(operation.id).toBe('honeycomb_app_action');

    const parsed = parseCustomJsonEnvelope(operation.json);
    expect(parsed.payload).toMatchObject({
      kind: 'app_action',
      action: 'ping',
      message: 'Hello Hive',
    });
  });

  it('normalizes generated operation ids', () => {
    expect(createOperationId('Honeycomb Starter', 'Create Item')).toBe('honeycomb_starter_create_item');
  });
});
