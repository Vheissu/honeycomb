import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';
import {
  ALL_OPERATION_IDS,
  DefaultHiveApiNodes,
  PlatformDefaults,
  SupportedAuthProviders,
  isValidOperationId,
  normalizeOperationId,
  parseStringList,
  sanitizeOperationPrefix,
} from '@honeycomb/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');

dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config();

const TRUE_ENV_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_ENV_VALUES = new Set(['0', 'false', 'no', 'off']);

export function coerceBooleanEnvValue(value: unknown): unknown {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }

    if (TRUE_ENV_VALUES.has(normalized)) {
      return true;
    }

    if (FALSE_ENV_VALUES.has(normalized)) {
      return false;
    }
  }

  return value;
}

export function coerceOptionalPositiveIntEnvValue(value: unknown): unknown {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      return undefined;
    }

    return Number(normalized);
  }

  return value;
}

const booleanEnvSchema = z
  .preprocess(coerceBooleanEnvValue, z.boolean().optional())
  .transform((value) => value ?? true);

const optionalPositiveIntEnvSchema = z.preprocess(
  coerceOptionalPositiveIntEnvValue,
  z.number().int().positive().optional(),
);

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
  HIVE_INDEXER_ENABLED: booleanEnvSchema,
  HIVE_INDEXER_START_BLOCK: optionalPositiveIntEnvSchema,
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
  const operationIds = parseStringList(getConfig().HIVE_INDEXER_OPERATION_IDS)
    .map((value) => normalizeOperationId(value));

  if (operationIds.length === 0 || operationIds.some((value) => !isValidOperationId(value))) {
    throw new Error(
      'HIVE_INDEXER_OPERATION_IDS must contain one or more lowercase operation ids separated by commas.',
    );
  }

  return [...new Set(operationIds)];
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
