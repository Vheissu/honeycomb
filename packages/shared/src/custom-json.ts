import type {
  BroadcastableCustomJson,
  CustomJsonEnvelope,
  ExampleActionPayload,
  HoneycombPayload,
} from './types.js';
import {
  isValidHiveUsername,
  isValidOperationId,
  normalizeOperationId,
  sanitizeOperationPrefix,
} from './validation.js';

interface BuildPostingCustomJsonOptions<T> {
  username: string;
  operationId: string;
  payload: T;
  app?: string;
  version?: string;
}

export function createCustomJsonEnvelope<T>(
  operationId: string,
  payload: T,
  app = 'honeycomb',
  version = '0.1.0',
): CustomJsonEnvelope<T> {
  const normalizedOperationId = normalizeOperationId(operationId);
  if (!isValidOperationId(normalizedOperationId)) {
    throw new Error('Operation ids must use lowercase letters, numbers, and underscores.');
  }

  return {
    app,
    version,
    operationId: normalizedOperationId,
    publishedAt: new Date().toISOString(),
    payload,
  };
}

export function buildPostingCustomJson<T>({
  username,
  operationId,
  payload,
  app = 'honeycomb',
  version = '0.1.0',
}: BuildPostingCustomJsonOptions<T>): BroadcastableCustomJson {
  const normalizedUsername = String(username ?? '').trim().toLowerCase();
  if (!isValidHiveUsername(normalizedUsername)) {
    throw new Error('A valid Hive username is required.');
  }

  const normalizedOperationId = normalizeOperationId(operationId);
  const envelope = createCustomJsonEnvelope(normalizedOperationId, payload, app, version);

  return {
    required_auths: [],
    required_posting_auths: [normalizedUsername],
    id: normalizedOperationId,
    json: JSON.stringify(envelope),
  };
}

export function parseCustomJsonEnvelope<T = HoneycombPayload>(json: string): CustomJsonEnvelope<T> {
  const parsed = JSON.parse(json) as Partial<CustomJsonEnvelope<T>>;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid custom_json envelope.');
  }

  if (typeof parsed.operationId !== 'string' || !parsed.operationId.trim()) {
    throw new Error('Envelope operationId is missing.');
  }

  if (!isValidOperationId(parsed.operationId)) {
    throw new Error('Envelope operationId is invalid.');
  }

  if (typeof parsed.publishedAt !== 'string' || !parsed.publishedAt.trim()) {
    throw new Error('Envelope publishedAt is missing.');
  }

  return parsed as CustomJsonEnvelope<T>;
}

export function createExampleActionPayload(
  message: string,
  action: ExampleActionPayload['action'] = 'ping',
  metadata: Record<string, string> = {},
): ExampleActionPayload {
  return {
    kind: 'app_action',
    action,
    message: String(message ?? '').trim(),
    metadata,
  };
}

export function createOperationId(prefix: string, suffix: string): string {
  const normalizedPrefix = sanitizeOperationPrefix(prefix);
  const normalizedSuffix = sanitizeOperationPrefix(suffix);
  return `${normalizedPrefix}_${normalizedSuffix}`;
}
