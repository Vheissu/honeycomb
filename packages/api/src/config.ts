import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';
import {
  ALL_OPERATION_IDS,
  DefaultHiveApiNodes,
  PlatformDefaults,
  SupportedAuthProviders,
  parseStringList,
  sanitizeOperationPrefix,
} from '@honeycomb/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');

dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config();

const envSchema = z.object({
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().min(1).max(65535).default(PlatformDefaults.API_PORT),
  CORS_ORIGIN: z.string().default(`http://localhost:${PlatformDefaults.WEB_PORT}`),
  PUBLIC_WEB_URL: z.string().url().default(`http://localhost:${PlatformDefaults.WEB_PORT}`),
  HIVE_API_NODES: z.string().default(DefaultHiveApiNodes.join(',')),
  HIVE_APP_NAME: z.string().min(1).default(PlatformDefaults.APP_NAME),
  HIVE_APP_TAGLINE: z.string().min(1).default(PlatformDefaults.APP_TAGLINE),
  HIVE_APP_DESCRIPTION: z.string().min(1).default(PlatformDefaults.APP_DESCRIPTION),
  HIVE_PLATFORM_ACCOUNT: z.string().min(1).default('honeycomb'),
  HIVESIGNER_CLIENT_ID: z.string().min(1).default('honeycomb'),
  HIVE_OPERATION_PREFIX: z.string().min(1).default('honeycomb'),
  HIVE_INDEXER_ENABLED: z.coerce.boolean().default(true),
  HIVE_INDEXER_START_BLOCK: z.coerce.number().int().positive().optional(),
  HIVE_INDEXER_STATE_FILE: z.string().min(1).default(PlatformDefaults.INDEXER_STATE_FILE),
  HIVE_INDEXER_OPERATION_IDS: z.string().default(ALL_OPERATION_IDS.join(',')),
});

export type Env = z.infer<typeof envSchema>;

let config: Env | null = null;

export function getConfig(): Env {
  if (!config) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('Invalid environment variables:');
      console.error(result.error.format());
      process.exit(1);
    }

    config = {
      ...result.data,
      HIVE_OPERATION_PREFIX: sanitizeOperationPrefix(result.data.HIVE_OPERATION_PREFIX),
    };
  }

  return config;
}

export function getRepoRoot(): string {
  return repoRoot;
}

export function getHiveApiNodes(): string[] {
  return parseStringList(getConfig().HIVE_API_NODES);
}

export function getIndexedOperationIds(): string[] {
  return parseStringList(getConfig().HIVE_INDEXER_OPERATION_IDS);
}

export function getSafeRuntimeConfig() {
  const env = getConfig();
  return {
    appName: env.HIVE_APP_NAME,
    tagline: env.HIVE_APP_TAGLINE,
    description: env.HIVE_APP_DESCRIPTION,
    platformAccount: env.HIVE_PLATFORM_ACCOUNT,
    hivesignerClientId: env.HIVESIGNER_CLIENT_ID,
    publicWebUrl: env.PUBLIC_WEB_URL,
    operationPrefix: env.HIVE_OPERATION_PREFIX,
    authProviders: [...SupportedAuthProviders],
    indexedOperationIds: getIndexedOperationIds(),
  };
}
