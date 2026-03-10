import { resolve } from 'aurelia';
import { IRouter } from '@aurelia/router';
import { AuthService } from '../../services/auth';

export function parseFragment(fragment: string): URLSearchParams {
  const raw = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  return new URLSearchParams(raw);
}

export function formatHivesignerOAuthError(error: string, description?: string | null): string {
  const code = String(error ?? '').trim();
  const details = String(description ?? '').trim();

  if (code === 'unauthorized_client') {
    return 'HiveSigner rejected this app. Configure the client account as an app, whitelist this callback URL, set profile.secret, and add ["hivesigner", 1] to posting.account_auths.';
  }

  if (details) {
    return `HiveSigner returned ${code}: ${details}`;
  }

  return `HiveSigner returned ${code}.`;
}

export class AuthCallback {
  private auth: AuthService = resolve(AuthService);
  private router: IRouter = resolve(IRouter);

  error: string | null = null;

  async attached(): Promise<void> {
    try {
      const url = new URL(window.location.href);
      const queryParams = url.searchParams;
      const fragmentParams = parseFragment(url.hash);

      const accessToken = fragmentParams.get('access_token') ?? queryParams.get('access_token');
      const username = fragmentParams.get('username') ?? queryParams.get('username');
      const expiresInRaw = fragmentParams.get('expires_in') ?? queryParams.get('expires_in');
      const oauthError = fragmentParams.get('error') ?? queryParams.get('error');
      const oauthErrorDescription =
        fragmentParams.get('error_description') ?? queryParams.get('error_description');

      window.history.replaceState({}, document.title, '/auth/callback');

      if (oauthError) {
        this.error = formatHivesignerOAuthError(oauthError, oauthErrorDescription);
        return;
      }

      if (!accessToken) {
        this.error = 'HiveSigner did not return an access token.';
        return;
      }

      let finalUsername = username;
      if (!finalUsername) {
        const response = await fetch('https://hivesigner.com/api/me', {
          method: 'POST',
          headers: {
            Authorization: accessToken,
          },
        });

        if (!response.ok) {
          this.error = 'HiveSigner login succeeded, but fetching the account profile failed.';
          return;
        }

        const payload = await response.json() as { user?: string };
        finalUsername = payload.user ?? null;
      }

      if (!finalUsername) {
        this.error = 'HiveSigner did not return a username.';
        return;
      }

      const expiresIn = expiresInRaw ? Number(expiresInRaw) : undefined;
      this.auth.handleHivesignerCallback(accessToken, finalUsername, expiresIn);
      await this.router.load('/playground');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'HiveSigner authentication failed.';
    }
  }
}
