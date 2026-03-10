import { Client } from '@hiveio/dhive';
import type { HiveAccountSnapshot } from '@honeycomb/shared';
import { getHiveApiNodes } from '../config.js';

let client: Client | null = null;

function toReputationScore(rawValue: unknown): number {
  const raw = Number(rawValue);
  if (!Number.isFinite(raw) || raw <= 0) {
    return 25;
  }

  const log10 = Math.log10(raw);
  const reputation = Math.max(log10 - 9, 0) * 9 + 25;
  return Number(reputation.toFixed(2));
}

export function getHiveClient(): Client {
  if (!client) {
    client = new Client(getHiveApiNodes(), {
      timeout: 8_000,
      failoverThreshold: 1,
    });
  }

  return client;
}

export function getPrimaryHiveNode(): string | null {
  return getHiveApiNodes()[0] ?? null;
}

export async function getHiveHeadBlockNumber(): Promise<number> {
  const props = await getHiveClient().database.getDynamicGlobalProperties();
  return props.last_irreversible_block_num;
}

export async function getHiveAccountSnapshot(username: string): Promise<HiveAccountSnapshot | null> {
  const normalized = username.trim().toLowerCase();
  const [account] = await getHiveClient().database.getAccounts([normalized]);

  if (!account) {
    return null;
  }

  return {
    username: account.name,
    reputation: toReputationScore(account.reputation),
    createdAt: account.created,
    postCount: typeof account.post_count === 'number' ? account.post_count : null,
    jsonMetadata: typeof account.json_metadata === 'string' ? account.json_metadata : null,
    postingJsonMetadata:
      typeof account.posting_json_metadata === 'string' ? account.posting_json_metadata : null,
  };
}
