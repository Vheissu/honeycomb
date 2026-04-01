import type {
  ApiHealth,
  AppManifest,
  HiveAccountSnapshot,
  IndexedOperationRecord,
  IndexerStatus,
  RuntimeConfig,
} from '@honeycomb/shared';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export class ApiService {
  getManifest(): Promise<AppManifest> {
    return request<AppManifest>('/api/public');
  }

  getConfig(): Promise<RuntimeConfig> {
    return request<RuntimeConfig>('/api/config');
  }

  getHealth(): Promise<ApiHealth> {
    return request<ApiHealth>('/api/health');
  }

  getIndexerStatus(): Promise<IndexerStatus> {
    return request<IndexerStatus>('/api/indexer/status');
  }

  getRecentIndexedOperations(): Promise<IndexedOperationRecord[]> {
    return request<IndexedOperationRecord[]>('/api/indexer/recent');
  }

  getAccount(username: string): Promise<HiveAccountSnapshot> {
    return request<HiveAccountSnapshot>(`/api/accounts/${encodeURIComponent(username)}`);
  }
}
