import { resolve } from 'aurelia';
import {
  buildPostingCustomJson,
  createExampleActionPayload,
  type BroadcastableCustomJson,
  type ExampleActionPayload,
} from '@honeycomb/shared';
import { AuthService } from './auth';

const APP_NAME = import.meta.env.VITE_HIVE_APP_NAME ?? 'Honeycomb';
const OPERATION_PREFIX = import.meta.env.VITE_HIVE_OPERATION_PREFIX ?? 'honeycomb';

interface BroadcastResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

export class HiveService {
  private auth: AuthService = resolve(AuthService);

  getDefaultOperationId(): string {
    return `${OPERATION_PREFIX}_app_action`;
  }

  createExamplePayload(message: string): ExampleActionPayload {
    return createExampleActionPayload(message || 'Hello Hive from Honeycomb');
  }

  buildPreviewOperation(
    username: string,
    operationId: string,
    payload: ExampleActionPayload,
  ): BroadcastableCustomJson {
    return buildPostingCustomJson({
      username,
      operationId,
      payload,
      app: APP_NAME.toLowerCase(),
      version: '0.1.0',
    });
  }

  private async hivesignerBroadcast(operations: any[]): Promise<BroadcastResult> {
    const token = this.auth.hivesignerAccessToken;
    if (!token) {
      return {
        success: false,
        error: 'HiveSigner access token is missing.',
      };
    }

    try {
      const response = await fetch('https://hivesigner.com/api/broadcast', {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({ operations }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok || (json && json.error)) {
        return {
          success: false,
          error: json?.error ?? `HiveSigner broadcast failed with ${response.status}.`,
        };
      }

      return {
        success: true,
        result: json,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'HiveSigner broadcast failed.',
      };
    }
  }

  async broadcastPostingCustomJson(
    operationId: string,
    payload: ExampleActionPayload,
  ): Promise<BroadcastResult> {
    const username = this.auth.username;
    if (!username) {
      return {
        success: false,
        error: 'Sign in first to broadcast to Hive.',
      };
    }

    const operation = this.buildPreviewOperation(username, operationId, payload);

    if (this.auth.authMethod === 'hivesigner') {
      return this.hivesignerBroadcast([
        ['custom_json', operation],
      ]);
    }

    if (this.auth.authMethod !== 'keychain') {
      return {
        success: false,
        error: 'Unsupported auth method.',
      };
    }

    return new Promise((resolveBroadcast) => {
      (window as any).hive_keychain.requestBroadcast(
        username,
        [
          ['custom_json', operation],
        ],
        'Posting',
        (response: any) => {
          if (response.success) {
            resolveBroadcast({
              success: true,
              result: response.result,
            });
            return;
          }

          resolveBroadcast({
            success: false,
            error: response.message ?? 'Hive Keychain broadcast failed.',
          });
        },
      );
    });
  }
}
