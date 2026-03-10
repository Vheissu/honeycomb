import type { FastifyInstance } from 'fastify';
import type { PublicEndpoint, StarterPackage } from '@honeycomb/shared';
import { getConfig, getIndexedOperationIds, getSafeRuntimeConfig } from '../config.js';
import { getLiveIndexerStatus } from '../indexer/stream.js';

const publicEndpoints: PublicEndpoint[] = [
  {
    method: 'GET',
    path: '/api/public',
    description: 'Starter manifest and public endpoint index',
  },
  {
    method: 'GET',
    path: '/api/config',
    description: 'Safe runtime config for the frontend',
  },
  {
    method: 'GET',
    path: '/api/health',
    description: 'API and indexer health',
  },
  {
    method: 'GET',
    path: '/api/accounts/:username',
    description: 'Hive account snapshot by username',
  },
  {
    method: 'GET',
    path: '/api/indexer/status',
    description: 'Current indexer status',
  },
];

const starterPackages: StarterPackage[] = [
  {
    name: 'packages/shared',
    description: 'Operation ids, payload contracts, validation helpers, and DTOs',
    stack: ['TypeScript', 'Vitest'],
  },
  {
    name: 'packages/api',
    description: 'Public API, config surface, account lookups, and Hive indexer',
    stack: ['Fastify', 'dhive', 'Zod'],
  },
  {
    name: 'packages/web',
    description: 'Aurelia 2 starter shell, live docs, auth flow, and operation playground',
    stack: ['Aurelia 2', 'Vite', 'Tailwind CSS v4'],
  },
];

const starterFeatures = [
  'Hive Keychain sign-in scaffold',
  'HiveSigner OAuth scaffold',
  'Typed custom_json helpers',
  'Resumable irreversible-block indexer',
  'Public API manifest',
  'Monorepo starter layout',
];

export async function platformRoutes(app: FastifyInstance) {
  app.get('/public', async () => {
    const config = getConfig();

    return {
      name: config.HIVE_APP_NAME,
      tagline: config.HIVE_APP_TAGLINE,
      description: config.HIVE_APP_DESCRIPTION,
      version: '0.1.0',
      website: config.PUBLIC_WEB_URL,
      platformAccount: config.HIVE_PLATFORM_ACCOUNT,
      operationPrefix: config.HIVE_OPERATION_PREFIX,
      authProviders: getSafeRuntimeConfig().authProviders,
      indexedOperationIds: getIndexedOperationIds(),
      features: starterFeatures,
      packages: starterPackages,
      endpoints: publicEndpoints,
    };
  });

  app.get('/config', async () => getSafeRuntimeConfig());

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    indexer: getLiveIndexerStatus(),
  }));
}
