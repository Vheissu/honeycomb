import type { FastifyInstance } from 'fastify';
import { getLiveIndexerStatus } from '../indexer/stream.js';

export async function indexerRoutes(app: FastifyInstance) {
  app.get('/indexer/status', async () => getLiveIndexerStatus());
}
