import type { SupportedAuthProvider } from './constants.js';

export interface PublicEndpoint {
  method: 'GET' | 'HEAD' | 'OPTIONS' | 'POST' | 'PATCH';
  path: string;
  description: string;
}

export interface StarterPackage {
  name: string;
  description: string;
  stack: string[];
}

export interface AppManifest {
  name: string;
  tagline: string;
  description: string;
  version: string;
  website: string;
  platformAccount: string;
  operationPrefix: string;
  authProviders: SupportedAuthProvider[];
  indexedOperationIds: string[];
  features: string[];
  packages: StarterPackage[];
  endpoints: PublicEndpoint[];
}

export interface RuntimeConfig {
  appName: string;
  tagline: string;
  description: string;
  platformAccount: string;
  hivesignerClientId: string;
  publicWebUrl: string;
  operationPrefix: string;
  authProviders: SupportedAuthProvider[];
  indexedOperationIds: string[];
}

export interface IndexerStatus {
  enabled: boolean;
  running: boolean;
  connectedNode: string | null;
  lastProcessedBlock: number | null;
  processedBlocks: number;
  matchedOperations: number;
  indexedOperationIds: string[];
  lastError: string | null;
}

export interface ApiHealth {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
  indexer: IndexerStatus;
}

export interface ExampleActionPayload {
  kind: 'app_action';
  action: 'ping' | 'bookmark' | 'vote';
  message: string;
  metadata?: Record<string, string>;
}

export interface ExampleCommentPayload {
  kind: 'app_comment';
  parentAuthor?: string | null;
  parentPermlink?: string | null;
  body: string;
  tags?: string[];
}

export type HoneycombPayload = ExampleActionPayload | ExampleCommentPayload | Record<string, unknown>;

export interface CustomJsonEnvelope<T = HoneycombPayload> {
  app: string;
  version: string;
  operationId: string;
  publishedAt: string;
  payload: T;
}

export interface BroadcastableCustomJson {
  required_auths: string[];
  required_posting_auths: string[];
  id: string;
  json: string;
}

export interface HiveAccountSnapshot {
  username: string;
  reputation: number;
  createdAt: string;
  postCount: number | null;
  jsonMetadata: string | null;
  postingJsonMetadata: string | null;
}
