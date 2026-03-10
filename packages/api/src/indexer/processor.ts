import { getConfig, getIndexedOperationIds } from '../config.js';
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

export async function processBlock(blockNum: number, block: any): Promise<void> {
  recordProcessedBlock(blockNum);

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
