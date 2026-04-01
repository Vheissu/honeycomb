import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../index.js';

describe('platform routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp({
      logger: false,
      serveWeb: false,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a public manifest', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/public',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      name: 'Honeycomb',
      operationPrefix: 'honeycomb',
      features: expect.arrayContaining(['GitHub Actions CI workflow']),
    });
  });

  it('returns health with indexer state', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
      indexer: {
        indexedOperationIds: expect.any(Array),
      },
    });
  });
});
