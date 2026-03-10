import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { getConfig } from './config.js';
import { initializeIndexerState } from './indexer/state-store.js';
import { startIndexer, stopIndexer } from './indexer/stream.js';
import { accountRoutes } from './routes/accounts.js';
import { indexerRoutes } from './routes/indexer.js';
import { platformRoutes } from './routes/platform.js';

interface CreateAppOptions {
  logger?: any;
  serveWeb?: boolean;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveCorsOrigin(input: string): string[] | true {
  if (input === '*') {
    return true;
  }

  const origins = input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
}

async function registerStaticSite(app: any): Promise<void> {
  const webDist = path.resolve(__dirname, '../../web/dist');
  if (!fs.existsSync(webDist)) {
    app.log.warn({ webDist }, 'Web dist not found; serving API only');
    return;
  }

  await app.register(fastifyStatic, {
    root: webDist,
    prefix: '/',
    setHeaders(response: any, filePath: string) {
      if (filePath.endsWith(`${path.sep}index.html`)) {
        response.setHeader('Cache-Control', 'no-store');
        return;
      }

      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return;
      }

      response.setHeader('Cache-Control', 'public, max-age=3600');
    },
  });

  app.setNotFoundHandler((request: any, reply: any) => {
    if (request.url.startsWith('/api')) {
      reply.code(404).send({
        error: 'Not Found',
        message: `Route ${request.method}:${request.url} not found`,
      });
      return;
    }

    const accept = request.headers.accept ?? '';
    const isHtml = request.method === 'GET' && accept.includes('text/html');
    if (!isHtml) {
      reply.code(404).send({
        error: 'Not Found',
        message: `Route ${request.method}:${request.url} not found`,
      });
      return;
    }

    return reply.type('text/html; charset=utf-8').sendFile('index.html');
  });
}

export async function createApp(options: CreateAppOptions = {}) {
  const config = getConfig();
  initializeIndexerState();

  const app = Fastify({
    logger: options.logger ?? {
      level: 'info',
    },
    trustProxy: true,
  });

  await app.register(cors, {
    origin: resolveCorsOrigin(config.CORS_ORIGIN),
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 86_400,
  });

  await app.register(platformRoutes, { prefix: '/api' });
  await app.register(accountRoutes, { prefix: '/api' });
  await app.register(indexerRoutes, { prefix: '/api' });

  if (options.serveWeb !== false) {
    await registerStaticSite(app);
  }

  return app;
}

async function main(): Promise<void> {
  const config = getConfig();
  const app = await createApp();

  await app.listen({
    host: config.HOST,
    port: config.PORT,
  });

  app.log.info(`Server listening on ${config.HOST}:${config.PORT}`);

  if (config.HIVE_INDEXER_ENABLED) {
    startIndexer().catch((error) => {
      app.log.error(
        { error: error instanceof Error ? error.message : error },
        'Indexer crashed',
      );
    });
  }

  const shutdown = async () => {
    stopIndexer();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === __filename : false;

if (isDirectRun) {
  void main();
}
