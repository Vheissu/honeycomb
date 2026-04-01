import { isValidHiveUsername } from '@honeycomb/shared';

const APP_NAME = import.meta.env.VITE_HIVE_APP_NAME ?? 'Honeycomb';
const STORAGE_KEY = 'honeycomb_auth';
const HIVE_API_NODE = 'https://api.hive.blog';
const HIVESIGNER_CLIENT_ID = (import.meta.env.VITE_HIVESIGNER_CLIENT_ID ?? 'honeycomb')
  .trim()
  .toLowerCase();
const ENV_HIVESIGNER_REDIRECT_URI = import.meta.env.VITE_HIVESIGNER_REDIRECT_URI ?? '';

interface HiveRpcErrorPayload {
  message?: string;
  data?: {
    message?: string;
  };
}

interface HiveRpcResponse {
  result?: unknown;
  error?: HiveRpcErrorPayload;
}

interface HiveAccount {
  name: string;
  json_metadata?: string;
  posting_json_metadata?: string;
  posting?: {
    account_auths?: Array<[string, number]>;
  };
}

export type AuthMethod = 'keychain' | 'hivesigner' | null;

export class AuthService {
  username: string | null = null;
  authMethod: AuthMethod = null;
  hivesignerAccessToken: string | null = null;
  hivesignerExpiresAtMs: number | null = null;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        username?: string;
        method?: AuthMethod;
        hivesignerAccessToken?: string | null;
        hivesignerExpiresAtMs?: number | null;
      };

      this.username = parsed.username ?? null;
      this.authMethod = parsed.method ?? null;
      this.hivesignerAccessToken = parsed.hivesignerAccessToken ?? null;
      this.hivesignerExpiresAtMs = parsed.hivesignerExpiresAtMs ?? null;

      if (this.username && !isValidHiveUsername(this.username)) {
        this.logout();
        return;
      }

      if (
        this.authMethod === 'hivesigner'
        && this.hivesignerExpiresAtMs
        && Date.now() > this.hivesignerExpiresAtMs
      ) {
        this.logout();
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  get isLoggedIn(): boolean {
    return this.username !== null;
  }

  get hasKeychain(): boolean {
    return typeof (window as any).hive_keychain !== 'undefined';
  }

  async loginWithKeychain(username: string): Promise<boolean> {
    const normalizedUsername = username.trim().toLowerCase();
    if (!isValidHiveUsername(normalizedUsername)) {
      throw new Error('Enter a valid Hive username.');
    }

    const keychain = (window as any).hive_keychain;

    if (!keychain) {
      throw new Error('Hive Keychain is not installed.');
    }

    return new Promise((resolve) => {
      const message = JSON.stringify({
        app: APP_NAME.toLowerCase(),
        timestamp: Date.now(),
      });

      keychain.requestSignBuffer(
        normalizedUsername,
        message,
        'Posting',
        (response: any) => {
          if (response.success) {
            this.username = normalizedUsername;
            this.authMethod = 'keychain';
            this.persistSession();
            resolve(true);
            return;
          }

          resolve(false);
        },
      );
    });
  }

  async loginWithHivesigner(): Promise<void> {
    if (!HIVESIGNER_CLIENT_ID) {
      throw new Error('VITE_HIVESIGNER_CLIENT_ID is missing.');
    }

    const redirectUri = ENV_HIVESIGNER_REDIRECT_URI || `${window.location.origin}/auth/callback`;
    await this.assertHivesignerClientConfig(HIVESIGNER_CLIENT_ID, redirectUri);

    const params = new URLSearchParams({
      client_id: HIVESIGNER_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: 'posting',
    });

    window.location.assign(`https://hivesigner.com/oauth2/authorize?${params}`);
  }

  handleHivesignerCallback(accessToken: string, username: string, expiresInSeconds?: number): void {
    const normalizedUsername = username.trim().toLowerCase();
    if (!isValidHiveUsername(normalizedUsername)) {
      throw new Error('HiveSigner returned an invalid Hive username.');
    }

    this.username = normalizedUsername;
    this.authMethod = 'hivesigner';
    this.hivesignerAccessToken = accessToken;
    this.hivesignerExpiresAtMs = expiresInSeconds
      ? Date.now() + expiresInSeconds * 1000
      : null;
    this.persistSession();
  }

  logout(): void {
    this.username = null;
    this.authMethod = null;
    this.hivesignerAccessToken = null;
    this.hivesignerExpiresAtMs = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  private persistSession(): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        username: this.username,
        method: this.authMethod,
        hivesignerAccessToken: this.hivesignerAccessToken,
        hivesignerExpiresAtMs: this.hivesignerExpiresAtMs,
      }),
    );
  }

  private async assertHivesignerClientConfig(clientId: string, redirectUri: string): Promise<void> {
    const response = await fetch(HIVE_API_NODE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'condenser_api.get_accounts',
        params: [[clientId]],
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      throw new Error('Unable to validate HiveSigner setup right now.');
    }

    const payload = await response.json() as HiveRpcResponse;
    const rpcError = payload.error?.data?.message ?? payload.error?.message;
    if (rpcError) {
      throw new Error(`Hive API returned an error while checking @${clientId}: ${rpcError}`);
    }

    const account = this.findHiveAccount(payload.result, clientId);
    if (!account) {
      throw new Error(`HiveSigner client account @${clientId} was not found on Hive.`);
    }

    const profile = this.resolveProfile(account);
    if (!profile || profile.type !== 'app') {
      throw new Error(`HiveSigner client @${clientId} must have profile.type = "app".`);
    }

    const redirectUris = Array.isArray(profile.redirect_uris)
      ? profile.redirect_uris.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      : [];

    if (!redirectUris.includes(redirectUri)) {
      throw new Error(`Add "${redirectUri}" to @${clientId} profile.redirect_uris.`);
    }

    if (typeof profile.secret !== 'string' || !profile.secret.trim()) {
      throw new Error(`HiveSigner client @${clientId} is missing profile.secret.`);
    }

    const accountAuths = Array.isArray(account.posting?.account_auths) ? account.posting.account_auths : [];
    const hasHivesignerPostingAuth = accountAuths.some((entry) => Array.isArray(entry) && entry[0] === 'hivesigner');
    if (!hasHivesignerPostingAuth) {
      throw new Error(`HiveSigner client @${clientId} must include ["hivesigner", 1] in posting.account_auths.`);
    }
  }

  private findHiveAccount(result: unknown, expectedName: string): HiveAccount | null {
    if (!Array.isArray(result)) {
      return null;
    }

    for (const entry of result) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const account = entry as HiveAccount;
      if (account.name === expectedName) {
        return account;
      }
    }

    return null;
  }

  private resolveProfile(account: HiveAccount): Record<string, unknown> | null {
    const postingProfile = this.profileFromMetadata(account.posting_json_metadata);
    if (postingProfile) {
      return postingProfile;
    }

    return this.profileFromMetadata(account.json_metadata);
  }

  private profileFromMetadata(rawMetadata: unknown): Record<string, unknown> | null {
    if (typeof rawMetadata !== 'string' || !rawMetadata.trim()) {
      return null;
    }

    try {
      const metadata = JSON.parse(rawMetadata) as { profile?: unknown };
      if (!metadata || typeof metadata !== 'object') {
        return null;
      }

      if (!metadata.profile || typeof metadata.profile !== 'object') {
        return null;
      }

      return metadata.profile as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
