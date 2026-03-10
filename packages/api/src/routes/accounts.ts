import type { FastifyInstance } from 'fastify';
import { isValidHiveUsername } from '@honeycomb/shared';
import { getHiveAccountSnapshot } from '../services/hive.js';

export async function accountRoutes(app: FastifyInstance) {
  app.get('/accounts/:username', async (request, reply) => {
    const { username } = request.params as { username?: string };
    const normalized = String(username ?? '').trim().toLowerCase();

    if (!isValidHiveUsername(normalized)) {
      reply.code(400);
      return {
        error: 'Invalid Hive username.',
      };
    }

    const account = await getHiveAccountSnapshot(normalized);
    if (!account) {
      reply.code(404);
      return {
        error: 'Hive account not found.',
      };
    }

    return account;
  });
}
