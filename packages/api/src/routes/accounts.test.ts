import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../index.js';
import * as hiveService from '../services/hive.js';

vi.mock('../services/hive.js', () => ({
  getHiveAccountSnapshot: vi.fn(),
}));

describe('account routes', () => {
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

  it('rejects invalid usernames before hitting Hive', async () => {
    const mockedGetHiveAccountSnapshot = vi.mocked(hiveService.getHiveAccountSnapshot);

    const response = await app.inject({
      method: 'GET',
      url: '/api/accounts/NOT_VALID',
    });

    expect(response.statusCode).toBe(400);
    expect(mockedGetHiveAccountSnapshot).not.toHaveBeenCalled();
  });

  it('returns 404 when the Hive account does not exist', async () => {
    const mockedGetHiveAccountSnapshot = vi.mocked(hiveService.getHiveAccountSnapshot);
    mockedGetHiveAccountSnapshot.mockResolvedValueOnce(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/accounts/alice',
    });

    expect(response.statusCode).toBe(404);
  });

  it('returns a Hive account snapshot', async () => {
    const mockedGetHiveAccountSnapshot = vi.mocked(hiveService.getHiveAccountSnapshot);
    mockedGetHiveAccountSnapshot.mockResolvedValueOnce({
      username: 'alice',
      reputation: 64.2,
      createdAt: '2020-01-01T00:00:00',
      postCount: 42,
      jsonMetadata: null,
      postingJsonMetadata: null,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/accounts/alice',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      username: 'alice',
      reputation: 64.2,
    });
  });
});
