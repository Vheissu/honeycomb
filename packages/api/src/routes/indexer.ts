import type { FastifyInstance } from 'fastify';
import { getRecentIndexedOperations } from '../indexer/recent-operations.js';
import { getLiveIndexerStatus } from '../indexer/stream.js';

export async function indexerRoutes(app: FastifyInstance) {
  app.get('/indexer/status', async () => getLiveIndexerStatus());
  app.get('/indexer/recent', async () => getRecentIndexedOperations());
}
