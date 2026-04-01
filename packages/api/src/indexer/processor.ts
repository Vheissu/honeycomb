import { parseCustomJsonEnvelope, type IndexedOperationRecord } from '@honeycomb/shared';
import { getConfig, getIndexedOperationIds } from '../config.js';
import { recordRecentIndexedOperation } from './recent-operations.js';
import { recordMatchedOperation, recordProcessedBlock } from './state-store.js';

function shouldIndexOperation(operationId: string): boolean {
  const operationIds = new Set(getIndexedOperationIds());
  if (operationIds.has(operationId)) {
    return true;
  }

  const prefix = `${getConfig().HIVE_OPERATION_PREFIX}_`;
  return operationId.startsWith(prefix);
}

function getOperationActor(operation: Record<string, unknown>): string | null {
  const postingAuths = Array.isArray(operation.required_posting_auths)
    ? operation.required_posting_auths
    : [];
  const activeAuths = Array.isArray(operation.required_auths) ? operation.required_auths : [];

  return String(postingAuths[0] ?? activeAuths[0] ?? '') || null;
}

function summarizePayload(payload: unknown): {
  payloadKind: string | null;
  payloadAction: string | null;
  summary: string;
} {
  if (!payload || typeof payload !== 'object') {
    return {
      payloadKind: null,
      payloadAction: null,
      summary: 'Raw custom_json payload',
    };
  }

  const payloadRecord = payload as Record<string, unknown>;
  const payloadKind = typeof payloadRecord.kind === 'string' ? payloadRecord.kind : null;
  const payloadAction = typeof payloadRecord.action === 'string' ? payloadRecord.action : null;

  if (payloadKind && payloadAction) {
    return {
      payloadKind,
      payloadAction,
      summary: `${payloadKind}:${payloadAction}`,
    };
  }

  if (payloadKind) {
    return {
      payloadKind,
      payloadAction,
      summary: payloadKind,
    };
  }

  return {
    payloadKind: null,
    payloadAction,
    summary: payloadAction ? `action:${payloadAction}` : 'Structured custom_json payload',
  };
}

function createRecentOperationRecord(
  blockNum: number,
  operationId: string,
  actor: string | null,
  rawJson: string,
  observedAt: string,
): IndexedOperationRecord {
  try {
    const envelope = parseCustomJsonEnvelope(rawJson);
    const payloadSummary = summarizePayload(envelope.payload);

    return {
      operationId,
      actor,
      blockNumber: blockNum,
      observedAt,
      publishedAt: envelope.publishedAt,
      payloadKind: payloadSummary.payloadKind,
      payloadAction: payloadSummary.payloadAction,
      summary: payloadSummary.summary,
    };
  } catch {
    return {
      operationId,
      actor,
      blockNumber: blockNum,
      observedAt,
      publishedAt: null,
      payloadKind: null,
      payloadAction: null,
      summary: 'Unparsed custom_json payload',
    };
  }
}

export async function processBlock(blockNum: number, block: any): Promise<void> {
  recordProcessedBlock(blockNum);
  let observedAt = new Date().toISOString();
  if (typeof block?.timestamp === 'string' && block.timestamp.trim()) {
    const normalizedTimestamp = block.timestamp.endsWith('Z')
      ? block.timestamp
      : `${block.timestamp}Z`;
    const parsedTimestamp = new Date(normalizedTimestamp);
    if (!Number.isNaN(parsedTimestamp.getTime())) {
      observedAt = parsedTimestamp.toISOString();
    }
  }

  const transactions = Array.isArray(block?.transactions) ? block.transactions : [];
  for (const transaction of transactions) {
    const operations = Array.isArray(transaction?.operations) ? transaction.operations : [];

    for (const operation of operations) {
      if (!Array.isArray(operation) || operation[0] !== 'custom_json') {
        continue;
      }

      const payload = operation[1] as Record<string, unknown>;
      const operationId = String(payload.id ?? '');
      if (!operationId || !shouldIndexOperation(operationId)) {
        continue;
      }

      recordMatchedOperation();

      const actor = getOperationActor(payload);
      const rawJson = typeof payload.json === 'string' ? payload.json : JSON.stringify(payload.json ?? {});
      recordRecentIndexedOperation(
        createRecentOperationRecord(blockNum, operationId, actor, rawJson, observedAt),
      );

      try {
        const parsed = JSON.parse(rawJson) as Record<string, unknown>;
        console.info(
          `[indexer] matched ${operationId} in block ${blockNum}${actor ? ` from @${actor}` : ''}`,
          parsed,
        );
      } catch {
        console.info(
          `[indexer] matched ${operationId} in block ${blockNum}${actor ? ` from @${actor}` : ''}`,
          rawJson,
        );
      }
    }
  }
}
