import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../index.js';
import {
  clearRecentIndexedOperations,
  recordRecentIndexedOperation,
} from '../indexer/recent-operations.js';

describe('indexer routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp({
      logger: false,
      serveWeb: false,
    });
  });

  beforeEach(() => {
    clearRecentIndexedOperations();
  });

  afterAll(async () => {
    clearRecentIndexedOperations();
    await app.close();
  });

  it('returns recent indexed operations for starter read-model examples', async () => {
    recordRecentIndexedOperation({
      operationId: 'honeycomb_app_action',
      actor: 'alice',
      blockNumber: 123,
      observedAt: '2026-04-01T00:00:00.000Z',
      publishedAt: '2026-04-01T00:00:00.000Z',
      payloadKind: 'app_action',
      payloadAction: 'ping',
      summary: 'app_action:ping',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/indexer/recent',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      expect.objectContaining({
        operationId: 'honeycomb_app_action',
        actor: 'alice',
        summary: 'app_action:ping',
      }),
    ]);
  });
});
