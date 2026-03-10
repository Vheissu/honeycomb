import fs from 'node:fs/promises';
import path from 'node:path';
import type { IndexerStatus } from '@honeycomb/shared';
import { getConfig, getIndexedOperationIds, getRepoRoot } from '../config.js';

interface PersistedState {
  lastProcessedBlock: number | null;
}

const runtimeState: IndexerStatus = {
  enabled: false,
  running: false,
  connectedNode: null,
  lastProcessedBlock: null,
  processedBlocks: 0,
  matchedOperations: 0,
  indexedOperationIds: [],
  lastError: null,
};

function getStatePath(): string {
  return path.resolve(getRepoRoot(), getConfig().HIVE_INDEXER_STATE_FILE);
}

export function initializeIndexerState(): void {
  runtimeState.enabled = getConfig().HIVE_INDEXER_ENABLED;
  runtimeState.indexedOperationIds = getIndexedOperationIds();
}

export function getIndexerStatus(): IndexerStatus {
  return {
    ...runtimeState,
    indexedOperationIds: [...runtimeState.indexedOperationIds],
  };
}

export function updateIndexerState(patch: Partial<IndexerStatus>): void {
  Object.assign(runtimeState, patch);
}

export function recordProcessedBlock(blockNum: number): void {
  runtimeState.lastProcessedBlock = blockNum;
  runtimeState.processedBlocks += 1;
  runtimeState.lastError = null;
}

export function recordMatchedOperation(): void {
  runtimeState.matchedOperations += 1;
}

export async function loadPersistedBlock(): Promise<number | null> {
  try {
    const raw = await fs.readFile(getStatePath(), 'utf8');
    const parsed = JSON.parse(raw) as PersistedState;
    return typeof parsed.lastProcessedBlock === 'number' ? parsed.lastProcessedBlock : null;
  } catch {
    return null;
  }
}

export async function persistLastProcessedBlock(blockNum: number): Promise<void> {
  const statePath = getStatePath();
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(
    statePath,
    JSON.stringify(
      {
        lastProcessedBlock: blockNum,
      } satisfies PersistedState,
      null,
      2,
    ),
    'utf8',
  );
}
