import { resolve } from 'aurelia';
import {
  createOperationId,
  type BroadcastableCustomJson,
  type ExampleActionPayload,
  type HiveAccountSnapshot,
  isValidOperationId,
} from '@honeycomb/shared';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { HiveService } from '../../services/hive';

const OPERATION_PREFIX = import.meta.env.VITE_HIVE_OPERATION_PREFIX ?? 'honeycomb';

export class Playground {
  private api: ApiService = resolve(ApiService);
  private auth: AuthService = resolve(AuthService);
  private hive: HiveService = resolve(HiveService);

  operationId = createOperationId(OPERATION_PREFIX, 'app_action');
  message = 'Hello Hive from Honeycomb';
  broadcastResult: string | null = null;
  broadcastError: string | null = null;
  broadcasting = false;
  lookupUsername = '';
  accountSnapshot: HiveAccountSnapshot | null = null;
  accountError: string | null = null;
  lookingUp = false;

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn;
  }

  get connectedUsername(): string {
    return this.auth.username ?? 'demo-user';
  }

  get authMethodLabel(): string {
    return this.auth.authMethod ?? 'none';
  }

  get examplePayload(): ExampleActionPayload {
    return this.hive.createExamplePayload(this.message);
  }

  get operationIdError(): string | null {
    return isValidOperationId(this.operationId)
      ? null
      : 'Use lowercase letters, numbers, and underscores for operation ids.';
  }

  get previewOperation(): BroadcastableCustomJson | null {
    try {
      if (this.operationIdError) {
        return null;
      }

      return this.hive.buildPreviewOperation(this.connectedUsername, this.operationId, this.examplePayload);
    } catch {
      return null;
    }
  }

  get previewJson(): string {
    if (this.operationIdError) {
      return this.operationIdError;
    }

    return JSON.stringify(this.previewOperation, null, 2);
  }

  get accountSnapshotJson(): string {
    return this.accountSnapshot ? JSON.stringify(this.accountSnapshot, null, 2) : '';
  }

  async broadcastExample(): Promise<void> {
    this.broadcastResult = null;
    this.broadcastError = null;

    const normalizedOperationId = this.operationId.trim().toLowerCase();
    this.operationId = normalizedOperationId;

    if (!isValidOperationId(normalizedOperationId)) {
      this.broadcastError = 'Use lowercase letters, numbers, and underscores for operation ids.';
      return;
    }

    this.broadcasting = true;

    try {
      const result = await this.hive.broadcastPostingCustomJson(normalizedOperationId, this.examplePayload);
      if (result.success) {
        this.broadcastResult = JSON.stringify(result.result ?? { ok: true }, null, 2);
        return;
      }

      this.broadcastError = result.error ?? 'Broadcast failed.';
    } catch (error) {
      this.broadcastError = error instanceof Error ? error.message : 'Broadcast failed.';
    } finally {
      this.broadcasting = false;
    }
  }

  async lookupAccount(): Promise<void> {
    this.accountError = null;
    this.accountSnapshot = null;
    this.lookingUp = true;

    const username = (this.lookupUsername || this.auth.username || '').trim().toLowerCase();
    if (!username) {
      this.accountError = 'Enter a Hive username to fetch account data.';
      this.lookingUp = false;
      return;
    }

    try {
      this.accountSnapshot = await this.api.getAccount(username);
    } catch (error) {
      this.accountError = error instanceof Error ? error.message : 'Account lookup failed.';
    } finally {
      this.lookingUp = false;
    }
  }
}
