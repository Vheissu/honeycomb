import type { IndexedOperationRecord } from '@honeycomb/shared';

const MAX_RECENT_OPERATIONS = 12;

const recentOperations: IndexedOperationRecord[] = [];

export function recordRecentIndexedOperation(operation: IndexedOperationRecord): void {
  recentOperations.unshift(operation);
  if (recentOperations.length > MAX_RECENT_OPERATIONS) {
    recentOperations.length = MAX_RECENT_OPERATIONS;
  }
}

export function getRecentIndexedOperations(): IndexedOperationRecord[] {
  return recentOperations.map((operation) => ({ ...operation }));
}

export function clearRecentIndexedOperations(): void {
  recentOperations.length = 0;
}
